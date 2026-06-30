import neo4j, { type Driver } from 'neo4j-driver';

export type Direction = 'emitente' | 'destinatario' | 'both';

export interface GrafoOptions {
    depth?: number; // 1..4 (padrão 1)
    direction?: Direction; // padrão 'both'
    limit?: number; // padrão 100
    includeProdutos?: boolean; // inclui os produtos emitidos pela empresa-raiz (padrão false)
}

export interface NoVizinho {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    grau: number;
    relacao: 'emitente' | 'destinatario';
    totalNFs: number;
}

export interface ArestaGrafo {
    de: string;
    para: string;
    totalNFs: number;
    valorTotal: number;
}

/** Produto emitido pela empresa-raiz (nó de produto opcional no grafo visual). */
export interface ProdutoNoGrafo {
    idUnico: string;
    descricao: string;
    ncm: string;
    totalNFs: number;
    valorTotal: number;
}

export interface EmpresaGrafo {
    cnpj: string;
    depth: number;
    nos: NoVizinho[];
    arestas: ArestaGrafo[];
    /** Presente apenas quando includeProdutos=true. Produtos emitidos pela empresa-raiz. */
    produtos?: ProdutoNoGrafo[];
}

export interface EmpresaStats {
    totalNFsEmitidas: number;
    totalNFsRecebidas: number;
    valorTotalEmitido: number;
    primeiraEmissao: string | null;
    ultimaEmissao: string | null;
}

export class DepthForaDoLimiteError extends Error {
    constructor(depth: number) {
        super(`depth ${depth} fora do limite permitido (1..4).`);
        this.name = 'DepthForaDoLimiteError';
    }
}

const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
        ? (v as { toNumber: () => number }).toNumber()
        : Number(v ?? 0);

/** Estatísticas agregadas de uma empresa (NFs emitidas/recebidas, valores, datas). */
export async function getCompanyStats(driver: Driver, cnpj: string): Promise<EmpresaStats> {
    const session = driver.session();
    try {
        // Emitidas e recebidas são agregadas em ramos SEPARADOS: juntar os dois
        // OPTIONAL MATCH no mesmo escopo cruzaria emitida×recebida e inflaria as
        // somas. sum() simples (não DISTINCT) — DISTINCT subcontaria NFs de mesmo
        // valor (auditoria F4).
        const res = await session.run(
            `MATCH (e:Empresa {cnpj: $cnpj})
             OPTIONAL MATCH (e)-[:EMITIU]->(emitida:NotaFiscal)
             WITH e, count(emitida) AS emitidas, sum(emitida.valorTotal) AS valorEmitido,
                  min(emitida.dataEmissao) AS primeira, max(emitida.dataEmissao) AS ultima
             OPTIONAL MATCH (e)<-[:DESTINADA_A]-(recebida:NotaFiscal)
             RETURN emitidas, count(recebida) AS recebidas, valorEmitido, primeira, ultima`,
            { cnpj },
        );
        const r = res.records[0];
        return {
            totalNFsEmitidas: toNum(r?.get('emitidas')),
            totalNFsRecebidas: toNum(r?.get('recebidas')),
            valorTotalEmitido: toNum(r?.get('valorEmitido')),
            primeiraEmissao: (r?.get('primeira') as string | null) ?? null,
            ultimaEmissao: (r?.get('ultima') as string | null) ?? null,
        };
    } finally {
        await session.close();
    }
}

/**
 * Vizinhos da empresa no grafo de transações até `depth` graus (máx 4).
 * `direction` filtra empresas alcançadas como emitente, destinatário ou ambos.
 */
export async function getCompanyGraph(
    driver: Driver,
    cnpj: string,
    opts: GrafoOptions = {},
): Promise<EmpresaGrafo> {
    const depth = opts.depth ?? 1;
    const direction = opts.direction ?? 'both';
    const limit = opts.limit ?? 100;
    if (depth < 1 || depth > 4) throw new DepthForaDoLimiteError(depth);

    // Padrão de caminho conforme a direção desejada.
    const rel =
        direction === 'emitente'
            ? '-[:EMITIU|DESTINADA_A*1..%d]-'
            : direction === 'destinatario'
              ? '-[:DESTINADA_A|EMITIU*1..%d]-'
              : '-[:EMITIU|DESTINADA_A*1..%d]-';
    const pattern = rel.replace('%d', String(depth * 2));

    const session = driver.session();
    try {
        const nodesRes = await session.run(
            `MATCH (origem:Empresa {cnpj: $cnpj})
             MATCH path = (origem)${pattern}(viz:Empresa)
             WHERE viz.cnpj <> $cnpj
             WITH viz, min(length(path)) AS dist
             OPTIONAL MATCH (viz)-[:EMITIU]->(nf:NotaFiscal)
             RETURN viz.cnpj AS cnpj, viz.razaoSocial AS razaoSocial, viz.uf AS uf,
                    (dist / 2) AS grau, count(nf) AS totalNFs
             ORDER BY grau ASC, totalNFs DESC
             LIMIT $limit`,
            { cnpj, limit: neo4j.int(limit) },
        );
        const nos: NoVizinho[] = nodesRes.records.map((r) => ({
            cnpj: r.get('cnpj') as string,
            razaoSocial: (r.get('razaoSocial') as string) ?? '',
            uf: (r.get('uf') as string) ?? '',
            grau: Math.max(1, toNum(r.get('grau'))),
            relacao: 'emitente',
            totalNFs: toNum(r.get('totalNFs')),
        }));

        const edgesRes = await session.run(
            `MATCH (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa)
             WHERE a.cnpj = $cnpj OR b.cnpj = $cnpj
             RETURN a.cnpj AS de, b.cnpj AS para, count(nf) AS totalNFs,
                    sum(nf.valorTotal) AS valorTotal
             LIMIT $limit`,
            { cnpj, limit: neo4j.int(limit) },
        );
        const arestas: ArestaGrafo[] = edgesRes.records.map((r) => ({
            de: r.get('de') as string,
            para: r.get('para') as string,
            totalNFs: toNum(r.get('totalNFs')),
            valorTotal: toNum(r.get('valorTotal')),
        }));

        // Produtos da empresa-raiz (opcional): nós de Produto para o grafo visual.
        let produtos: ProdutoNoGrafo[] | undefined;
        if (opts.includeProdutos) {
            const prodRes = await session.run(
                `MATCH (origem:Empresa {cnpj: $cnpj})-[:EMITIU]->(nf:NotaFiscal)-[c:CONTÉM]->(p:Produto)
                 OPTIONAL MATCH (p)-[:CLASSIFICADO_EM]->(ncm:NCM)
                 WITH p, ncm, count(DISTINCT nf) AS totalNFs, sum(c.valorTotal) AS valorTotal
                 RETURN p.idUnico AS idUnico, p.descricao AS descricao, ncm.codigo AS ncm,
                        totalNFs, valorTotal
                 ORDER BY valorTotal DESC
                 LIMIT $limit`,
                { cnpj, limit: neo4j.int(limit) },
            );
            produtos = prodRes.records.map((r) => ({
                idUnico: r.get('idUnico') as string,
                descricao: (r.get('descricao') as string) ?? '',
                ncm: (r.get('ncm') as string) ?? '',
                totalNFs: toNum(r.get('totalNFs')),
                valorTotal: toNum(r.get('valorTotal')),
            }));
        }

        return { cnpj, depth, nos, arestas, ...(produtos ? { produtos } : {}) };
    } finally {
        await session.close();
    }
}
