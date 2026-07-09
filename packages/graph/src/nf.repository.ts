import type { Driver } from 'neo4j-driver';
import {
    lookupNcm,
    lookupCfop,
    type NotaFiscalNode,
    type EmpresaNode,
    type ProdutoNode,
    type NCMNode,
    type CFOPNode,
    type ContemEdge,
    type TotaisNF,
    type RawDataNode,
} from '@notagrafo/core';

/** Um item da NF pronto para gravação: produto, classificação e a aresta CONTÉM. */
export interface ItemToPersist {
    produto: ProdutoNode;
    ncm: NCMNode;
    cfop: CFOPNode;
    contem: ContemEdge;
}

/** Payload completo de uma NF para gravar no grafo. */
export interface InvoiceToPersist {
    nota: NotaFiscalNode;
    emitente: EmpresaNode;
    destinatario?: EmpresaNode;
    raw: RawDataNode;
    itens: ItemToPersist[];
    /** Totais da NF (grupo total/ICMSTot) — gravados como props total_* no nó NotaFiscal. */
    totais?: TotaisNF;
    /** Chaves de NFes referenciadas (ide/NFref/refNFe) — base da aresta DEVOLVE. */
    referencias?: string[];
}

/** Remove chaves com valor undefined/null (o Neo4j não aceita propriedade null). */
function clean(obj: object): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
}

/**
 * Serializa a NF para o SET: datas viram ISO string e os totais (se houver) são
 * achatados no nó com prefixo `total_` (ex.: total_vICMS). Isso mantém os
 * agregados por NF a um passo das queries de stats (sum(nf.total_vICMS)).
 */
function serializeInvoice(nota: NotaFiscalNode, totais?: TotaisNF): Record<string, unknown> {
    const totaisPrefixed: Record<string, unknown> = {};
    if (totais) {
        for (const [k, v] of Object.entries(totais)) totaisPrefixed[`total_${k}`] = v;
    }
    return clean({
        ...nota,
        dataEmissao: nota.dataEmissao.toISOString(),
        dataSaida: nota.dataSaida.toISOString(),
        importadaEm: nota.importadaEm.toISOString(),
        ...(nota.processadaEm ? { processadaEm: nota.processadaEm.toISOString() } : {}),
        ...totaisPrefixed,
    });
}

/** Enriquece o NCM com descrição/seção/capítulo do catálogo, sem sobrescrever o que o parser trouxe. */
function enrichNcm(ncm: NCMNode): Record<string, unknown> {
    const cat = lookupNcm(ncm.codigo);
    // o objeto do parser tem prioridade: só completa o que está ausente.
    return clean({ ...cat, ...ncm });
}

/** Enriquece o CFOP com descrição/tipo/natureza do catálogo, sem sobrescrever o que o parser trouxe. */
function enrichCfop(cfop: CFOPNode): Record<string, unknown> {
    const cat = lookupCfop(cfop.codigo);
    return clean({ ...cat, ...cfop });
}

/**
 * Grava (upsert) uma NF e todo o seu grafo seguindo o padrão MERGE da seção 4
 * do 01 schema dados.md. Idempotente por chaveAcesso: reprocessar a mesma NF
 * não duplica nós (todos os nós com constraint usam MERGE; RawData e itens são
 * reconciliados pela chave da NF).
 *
 * Roda numa única transação de escrita.
 */
export async function mergeInvoice(driver: Driver, data: InvoiceToPersist): Promise<void> {
    const { nota, emitente, destinatario, raw, itens, totais, referencias } = data;
    const session = driver.session();
    try {
        await session.executeWrite(async (tx) => {
            // 1. Emitente (MERGE — pode já existir)
            await tx.run(
                `MERGE (emit:Empresa {cnpj: $cnpj})
                 ON CREATE SET emit += $dados
                 ON MATCH SET emit += $dados`,
                { cnpj: emitente.cnpj, dados: clean(emitente) },
            );

            // 2. Destinatário (opcional). ON CREATE + ON MATCH SET (como o emitente):
            // uma empresa que apareceu primeiro como stub (só cnpj, via aresta
            // DEVOLVE) ou incompleta e depois é reimportada como destinatária tem os
            // dados atualizados — antes só ON CREATE SET não atualizava (NOTA-203).
            if (destinatario) {
                await tx.run(
                    `MERGE (dest:Empresa {cnpj: $cnpj})
                     ON CREATE SET dest += $dados
                     ON MATCH SET dest += $dados`,
                    { cnpj: destinatario.cnpj, dados: clean(destinatario) },
                );
            }

            // 3. NF (MERGE — constraint garante unicidade). Totais achatados como total_*.
            await tx.run(
                `MERGE (nf:NotaFiscal {chaveAcesso: $chave})
                 ON CREATE SET nf += $dados
                 ON MATCH SET nf += $dados`,
                { chave: nota.chaveAcesso, dados: serializeInvoice(nota, totais) },
            );

            // 4. RawData — reconciliado pela NF (MERGE da relação evita duplicar em reprocesso)
            await tx.run(
                `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                 MERGE (nf)-[:TEM_RAW]->(raw:RawData)
                 SET raw = $dados`,
                { chave: nota.chaveAcesso, dados: clean(raw) },
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
                    // NCM/CFOP: SET incondicional aplica o catálogo (descricao/tipo/...)
                    // mesmo a nós já existentes de NFs anteriores (antes desta fase).
                    `MERGE (prod:Produto {idUnico: $idUnico}) ON CREATE SET prod += $dadosProd
                     MERGE (ncm:NCM {codigo: $codigoNcm}) SET ncm += $dadosNcm
                     MERGE (prod)-[:CLASSIFICADO_EM]->(ncm)
                     WITH prod
                     MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                     MERGE (cfop:CFOP {codigo: $codigoCfop}) SET cfop += $dadosCfop
                     MERGE (nf)-[:USA_CFOP]->(cfop)
                     MERGE (nf)-[c:CONTÉM {numeroItem: $numeroItem}]->(prod)
                     SET c += $dadosContem`,
                    {
                        chave: nota.chaveAcesso,
                        idUnico: item.produto.idUnico,
                        dadosProd: clean(item.produto),
                        codigoNcm: item.ncm.codigo,
                        dadosNcm: enrichNcm(item.ncm),
                        codigoCfop: item.cfop.codigo,
                        dadosCfop: enrichCfop(item.cfop),
                        numeroItem: item.contem.numeroItem,
                        dadosContem: clean(item.contem),
                    },
                );
            }

            // 7. Evento de importação — idempotente: só cria se a NF ainda não tem
            //    um evento 'importada' (reprocessar a mesma chave não duplica — F2).
            await tx.run(
                `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                 WHERE NOT EXISTS { (nf)-[:TEM_EVENTO]->(:Evento {tipo: 'importada'}) }
                 CREATE (ev:Evento {tipo: 'importada', timestamp: datetime(), autor: 'sistema'})
                 MERGE (nf)-[:TEM_EVENTO]->(ev)`,
                { chave: nota.chaveAcesso },
            );

            // 8. Notas referenciadas (ide/NFref/refNFe). Numa devolução (finalidade
            //    'devolucao') a NF aponta para a(s) NF(s) de origem via DEVOLVE.
            //    A NF-alvo é um MERGE: se ainda não foi importada, vira um stub
            //    (só chaveAcesso) que é completado quando/ se chegar. MERGE da aresta
            //    garante idempotência no reprocessamento.
            if (nota.finalidade === 'devolucao' && referencias?.length) {
                for (const chaveRef of referencias) {
                    if (chaveRef === nota.chaveAcesso) continue; // evita auto-referência
                    await tx.run(
                        `MATCH (nf:NotaFiscal {chaveAcesso: $chave})
                         MERGE (orig:NotaFiscal {chaveAcesso: $chaveRef})
                         MERGE (nf)-[d:DEVOLVE]->(orig)
                         SET d.chaveRefNF = $chaveRef`,
                        { chave: nota.chaveAcesso, chaveRef },
                    );
                }
            }
        });
    } finally {
        await session.close();
    }
}
