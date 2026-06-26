import type { Driver } from 'neo4j-driver';
import type {
    NotaFiscalNode,
    EmpresaNode,
    ProdutoNode,
    NCMNode,
    CFOPNode,
    ContemEdge,
    RawDataNode,
} from '@notagrafo/core';

/** Um item da NF pronto para gravação: produto, classificação e a aresta CONTÉM. */
export interface ItemParaGravar {
    produto: ProdutoNode;
    ncm: NCMNode;
    cfop: CFOPNode;
    contem: ContemEdge;
}

/** Payload completo de uma NF para gravar no grafo. */
export interface NotaFiscalParaGravar {
    nota: NotaFiscalNode;
    emitente: EmpresaNode;
    destinatario?: EmpresaNode;
    raw: RawDataNode;
    itens: ItemParaGravar[];
}

/** Remove chaves com valor undefined/null (o Neo4j não aceita propriedade null). */
function limpar(obj: object): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
}

/** Converte Date para string ISO (o driver grava como datetime via toString). */
function serializarNota(nota: NotaFiscalNode): Record<string, unknown> {
    return limpar({
        ...nota,
        dataEmissao: nota.dataEmissao.toISOString(),
        dataSaida: nota.dataSaida.toISOString(),
        importadaEm: nota.importadaEm.toISOString(),
        ...(nota.processadaEm ? { processadaEm: nota.processadaEm.toISOString() } : {}),
    });
}

/**
 * Grava (upsert) uma NF e todo o seu grafo seguindo o padrão MERGE da seção 4
 * do 01 schema dados.md. Idempotente por chaveAcesso: reprocessar a mesma NF
 * não duplica nós (todos os nós com constraint usam MERGE; RawData e itens são
 * reconciliados pela chave da NF).
 *
 * Roda numa única transação de escrita.
 */
export async function mergeNotaFiscal(driver: Driver, dados: NotaFiscalParaGravar): Promise<void> {
    const { nota, emitente, destinatario, raw, itens } = dados;
    const session = driver.session();
    try {
        await session.executeWrite(async (tx) => {
            // 1. Emitente (MERGE — pode já existir)
            await tx.run(
                `MERGE (emit:Empresa {cnpj: $cnpj})
                 ON CREATE SET emit += $dados
                 ON MATCH SET emit += $dados`,
                { cnpj: emitente.cnpj, dados: limpar(emitente) },
            );
            await tx.run(`MATCH (emit:Empresa {cnpj: $cnpj}) RETURN emit`, { cnpj: emitente.cnpj });

            // 2. Destinatário (opcional)
            if (destinatario) {
                await tx.run(
                    `MERGE (dest:Empresa {cnpj: $cnpj}) ON CREATE SET dest += $dados`,
                    { cnpj: destinatario.cnpj, dados: limpar(destinatario) },
                );
            }

            // 3. NF (MERGE — constraint garante unicidade)
            await tx.run(
                `MERGE (nf:NotaFiscal {chaveAcesso: $chave})
                 ON CREATE SET nf += $dados
                 ON MATCH SET nf += $dados`,
                { chave: nota.chaveAcesso, dados: serializarNota(nota) },
            );

            // 4. RawData — reconciliado pela NF (MERGE da relação evita duplicar em reprocesso)
            await tx.run(
                `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                 MERGE (nf)-[:TEM_RAW]->(raw:RawData)
                 SET raw = $dados`,
                { chave: nota.chaveAcesso, dados: limpar(raw) },
            );

            // 5. Emitente/destinatário ligados à NF
            await tx.run(
                `MATCH (emit:Empresa {cnpj: $cnpjEmit}), (nf:NotaFiscal {chaveAcesso: $chave})
                 MERGE (emit)-[:EMITIU]->(nf)`,
                { cnpjEmit: emitente.cnpj, chave: nota.chaveAcesso },
            );
            if (destinatario) {
                await tx.run(
                    `MATCH (nf:NotaFiscal {chaveAcesso: $chave}), (dest:Empresa {cnpj: $cnpjDest})
                     MERGE (nf)-[:DESTINADA_A]->(dest)`,
                    { chave: nota.chaveAcesso, cnpjDest: destinatario.cnpj },
                );
            }

            // 6. Itens: produto, NCM, CFOP e a aresta CONTÉM
            for (const item of itens) {
                await tx.run(
                    `MERGE (prod:Produto {idUnico: $idUnico}) ON CREATE SET prod += $dadosProd
                     MERGE (ncm:NCM {codigo: $codigoNcm}) ON CREATE SET ncm += $dadosNcm
                     MERGE (prod)-[:CLASSIFICADO_EM]->(ncm)
                     WITH prod
                     MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                     MERGE (cfop:CFOP {codigo: $codigoCfop}) ON CREATE SET cfop += $dadosCfop
                     MERGE (nf)-[:USA_CFOP]->(cfop)
                     MERGE (nf)-[c:CONTÉM {numeroItem: $numeroItem}]->(prod)
                     SET c += $dadosContem`,
                    {
                        chave: nota.chaveAcesso,
                        idUnico: item.produto.idUnico,
                        dadosProd: limpar(item.produto),
                        codigoNcm: item.ncm.codigo,
                        dadosNcm: limpar(item.ncm),
                        codigoCfop: item.cfop.codigo,
                        dadosCfop: limpar(item.cfop),
                        numeroItem: item.contem.numeroItem,
                        dadosContem: limpar(item.contem),
                    },
                );
            }

            // 7. Evento de importação
            await tx.run(
                `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                 CREATE (ev:Evento {tipo: 'importada', timestamp: datetime(), autor: 'sistema'})
                 MERGE (nf)-[:TEM_EVENTO]->(ev)`,
                { chave: nota.chaveAcesso },
            );
        });
    } finally {
        await session.close();
    }
}
