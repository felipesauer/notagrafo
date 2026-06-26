import neo4j, { type Driver } from 'neo4j-driver';

export type MetricaProduto = 'valor' | 'quantidade';

export interface TopProdutosOptions {
    metrica?: MetricaProduto; // padrão 'valor'
    limit?: number; // padrão 10, máx 50
    ncm?: string;
    dataInicio?: string; // ISO; default tratado pelo chamador (30 dias)
    dataFim?: string; // ISO
}

export interface ProdutoRanking {
    posicao: number;
    idUnico: string;
    descricao: string;
    ean?: string;
    ncm: string;
    totalNFs: number;
    quantidadeTotal: number;
    valorTotal: number;
    precoMedio: number;
}

export interface PrecoHistoricoPonto {
    periodo: string; // YYYY-MM
    precoMedio: number;
    quantidadeTotal: number;
    totalNFs: number;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const toNum = (v: unknown): number =>
    typeof v === 'number'
        ? v
        : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
          ? (v as { toNumber: () => number }).toNumber()
          : Number(v ?? 0);

/** Ranking de produtos por valor ou quantidade, opcionalmente filtrado por NCM e período. */
export async function topProdutos(
    driver: Driver,
    opts: TopProdutosOptions = {},
): Promise<ProdutoRanking[]> {
    const metrica = opts.metrica === 'quantidade' ? 'quantidade' : 'valor';
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const ordenarPor = metrica === 'quantidade' ? 'quantidadeTotal' : 'valorTotal';

    const where: string[] = [];
    const params: Record<string, unknown> = { limit: neo4j.int(limit) };
    if (opts.ncm) (where.push('ncm.codigo STARTS WITH $ncm'), (params.ncm = opts.ncm));
    if (opts.dataInicio) (where.push('nf.dataEmissao >= $dataInicio'), (params.dataInicio = opts.dataInicio));
    if (opts.dataFim) (where.push('nf.dataEmissao <= $dataFim'), (params.dataFim = opts.dataFim));
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (nf:NotaFiscal)-[c:CONTÉM]->(prod:Produto)-[:CLASSIFICADO_EM]->(ncm:NCM)
             ${whereClause}
             WITH prod, ncm,
                  count(DISTINCT nf) AS totalNFs,
                  sum(c.quantidade) AS quantidadeTotal,
                  sum(c.valorTotal) AS valorTotal
             RETURN prod.idUnico AS idUnico, prod.descricao AS descricao, prod.ean AS ean,
                    ncm.codigo AS ncm, totalNFs, quantidadeTotal, valorTotal
             ORDER BY ${ordenarPor} DESC
             LIMIT $limit`,
            params,
        );
        return res.records.map((r, i) => {
            const quantidadeTotal = toNum(r.get('quantidadeTotal'));
            const valorTotal = toNum(r.get('valorTotal'));
            const ean = r.get('ean') as string | null;
            return {
                posicao: i + 1,
                idUnico: r.get('idUnico') as string,
                descricao: (r.get('descricao') as string) ?? '',
                ...(ean ? { ean } : {}),
                ncm: r.get('ncm') as string,
                totalNFs: toNum(r.get('totalNFs')),
                quantidadeTotal,
                valorTotal,
                precoMedio: quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0,
            };
        });
    } finally {
        await session.close();
    }
}

/** Histórico de preço médio de um produto, agrupado por mês (YYYY-MM). */
export async function historicoPrecoProduto(
    driver: Driver,
    idUnico: string,
): Promise<PrecoHistoricoPonto[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (nf:NotaFiscal)-[c:CONTÉM]->(prod:Produto {idUnico: $idUnico})
             WITH substring(nf.dataEmissao, 0, 7) AS periodo,
                  sum(c.valorTotal) AS valorTotal,
                  sum(c.quantidade) AS quantidadeTotal,
                  count(DISTINCT nf) AS totalNFs
             RETURN periodo, valorTotal, quantidadeTotal, totalNFs
             ORDER BY periodo ASC`,
            { idUnico },
        );
        return res.records.map((r) => {
            const valorTotal = toNum(r.get('valorTotal'));
            const quantidadeTotal = toNum(r.get('quantidadeTotal'));
            return {
                periodo: r.get('periodo') as string,
                precoMedio: quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0,
                quantidadeTotal,
                totalNFs: toNum(r.get('totalNFs')),
            };
        });
    } finally {
        await session.close();
    }
}
