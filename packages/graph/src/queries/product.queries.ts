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

/** Uma empresa ligada a um produto, com o papel que exerce nas NFs desse produto. */
export interface ProdutoEmpresa {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    papel: 'emitente' | 'destinatario';
    totalNFs: number;
    valor: number; // soma do valorTotal dos itens (aresta CONTÉM) desse produto
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
export async function topProducts(
    driver: Driver,
    opts: TopProdutosOptions = {},
): Promise<ProdutoRanking[]> {
    const metric = opts.metrica === 'quantidade' ? 'quantidade' : 'valor';
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const orderBy = metric === 'quantidade' ? 'quantidadeTotal' : 'valorTotal';

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
             ORDER BY ${orderBy} DESC
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
export async function productPriceHistory(
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

/**
 * Empresas ligadas a um produto (cruzamento produto↔empresa): emitentes (quem
 * emitiu NFs que CONTÊM o produto) e destinatários (quem as recebeu). Para cada
 * empresa, soma o valorTotal dos itens daquele produto e conta as NFs. Ordena
 * por valor desc. Uma empresa pode aparecer nos dois papéis (linhas distintas).
 */
export async function productCompanies(driver: Driver, idUnico: string): Promise<ProdutoEmpresa[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (e:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[c:CONTÉM]->(:Produto {idUnico: $idUnico})
             WITH e, 'emitente' AS papel, count(DISTINCT nf) AS totalNFs, sum(c.valorTotal) AS valor
             RETURN e.cnpj AS cnpj, e.razaoSocial AS razaoSocial, e.uf AS uf, papel, totalNFs, valor
             UNION
             MATCH (nf:NotaFiscal)-[c:CONTÉM]->(:Produto {idUnico: $idUnico}),
                   (nf)-[:DESTINADA_A]->(e:Empresa)
             WITH e, 'destinatario' AS papel, count(DISTINCT nf) AS totalNFs, sum(c.valorTotal) AS valor
             RETURN e.cnpj AS cnpj, e.razaoSocial AS razaoSocial, e.uf AS uf, papel, totalNFs, valor
             ORDER BY valor DESC`,
            { idUnico },
        );
        return res.records.map((r) => ({
            cnpj: r.get('cnpj') as string,
            razaoSocial: (r.get('razaoSocial') as string) ?? '',
            uf: (r.get('uf') as string) ?? '',
            papel: r.get('papel') as 'emitente' | 'destinatario',
            totalNFs: toNum(r.get('totalNFs')),
            valor: toNum(r.get('valor')),
        }));
    } finally {
        await session.close();
    }
}
