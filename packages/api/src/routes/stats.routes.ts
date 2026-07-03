import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import {
    topProducts,
    productPriceHistory,
    productCompanies,
    taxSummary,
    taxByNcm,
    taxByCfop,
    getFluxoEmpresas,
    type MetricaProduto,
    type TaxFilters,
} from '@notagrafo/graph';

const toNum = (v: unknown): number =>
    typeof v === 'number'
        ? v
        : v && typeof (v as { toNumber?: () => number }).toNumber === 'function'
          ? (v as { toNumber: () => number }).toNumber()
          : Number(v ?? 0);

export async function statsRoutes(app: FastifyInstance, driver: Driver): Promise<void> {
    // GET /stats/overview — KPIs gerais
    app.get(
        '/stats/overview',
        { preHandler: app.authenticate, schema: { tags: ['stats'], summary: 'KPIs gerais', security: [{ bearerAuth: [] }] } },
        async () => {
            const session = driver.session();
            try {
                // status IS NOT NULL exclui NFs stub (origem de DEVOLVE ainda não importada — auditoria F3).
                const totais = await session.run(
                    `MATCH (nf:NotaFiscal) WHERE nf.status IS NOT NULL
                     RETURN count(nf) AS totalNFs, sum(nf.valorTotal) AS valor`,
                );
                const empresas = await session.run('MATCH (e:Empresa) RETURN count(e) AS c');
                const produtos = await session.run('MATCH (p:Produto) RETURN count(p) AS c');
                const porStatus = await session.run(
                    'MATCH (nf:NotaFiscal) WHERE nf.status IS NOT NULL RETURN nf.status AS status, count(nf) AS c',
                );
                const ultimas = await session.run(
                    `MATCH (nf:NotaFiscal) WHERE nf.status IS NOT NULL
                     RETURN nf.chaveAcesso AS chaveAcesso, nf.numero AS numero,
                            nf.valorTotal AS valorTotal, nf.importadaEm AS processadaEm
                     ORDER BY nf.importadaEm DESC LIMIT 10`,
                );
                const nfsPorStatus: Record<string, number> = {};
                for (const r of porStatus.records) nfsPorStatus[r.get('status') as string] = toNum(r.get('c'));
                return {
                    totalNFs: toNum(totais.records[0]?.get('totalNFs')),
                    totalEmpresas: toNum(empresas.records[0]?.get('c')),
                    totalProdutos: toNum(produtos.records[0]?.get('c')),
                    valorTotalProcessado: toNum(totais.records[0]?.get('valor')),
                    nfsPorStatus,
                    ultimasProcessadas: ultimas.records.map((r) => ({
                        chaveAcesso: r.get('chaveAcesso'),
                        numero: r.get('numero'),
                        valorTotal: toNum(r.get('valorTotal')),
                        processadaEm: r.get('processadaEm'),
                    })),
                };
            } finally {
                await session.close();
            }
        },
    );

    // GET /stats/volume — série temporal por granularidade
    app.get<{ Querystring: { granularidade?: string; dataInicio?: string; dataFim?: string } }>(
        '/stats/volume',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Série temporal de volume e valor',
                querystring: {
                    type: 'object',
                    properties: {
                        granularidade: { type: 'string', enum: ['hora', 'dia', 'semana', 'mes'] },
                        dataInicio: { type: 'string' },
                        dataFim: { type: 'string' },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const granularidade = request.query.granularidade ?? 'dia';
            // YYYY-MM-DD (dia), YYYY-MM (mes), YYYY-MM-DDTHH (hora). Semana aproxima por dia.
            const len = granularidade === 'mes' ? 7 : granularidade === 'hora' ? 13 : 10;
            const where: string[] = [];
            const params: Record<string, unknown> = {};
            if (request.query.dataInicio) (where.push('nf.dataEmissao >= $ini'), (params.ini = request.query.dataInicio));
            if (request.query.dataFim) (where.push('nf.dataEmissao <= $fim'), (params.fim = request.query.dataFim));
            const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
            const session = driver.session();
            try {
                const res = await session.run(
                    `MATCH (nf:NotaFiscal) ${whereClause}
                     WITH substring(nf.dataEmissao, 0, ${len}) AS periodo,
                          count(nf) AS totalNFs, sum(nf.valorTotal) AS valorTotal,
                          sum(CASE WHEN nf.status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
                     RETURN periodo, totalNFs, valorTotal, canceladas
                     ORDER BY periodo ASC`,
                    params,
                );
                return {
                    granularidade,
                    serie: res.records.map((r) => ({
                        periodo: r.get('periodo'),
                        totalNFs: toNum(r.get('totalNFs')),
                        valorTotal: toNum(r.get('valorTotal')),
                        canceladas: toNum(r.get('canceladas')),
                    })),
                };
            } finally {
                await session.close();
            }
        },
    );

    // GET /stats/top-empresas
    app.get<{ Querystring: { tipo?: string; metrica?: string; limit?: number; dataInicio?: string; dataFim?: string } }>(
        '/stats/top-empresas',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Ranking de empresas',
                querystring: {
                    type: 'object',
                    properties: {
                        tipo: { type: 'string', enum: ['emitente', 'destinatario'] },
                        metrica: { type: 'string', enum: ['valor', 'quantidade'] },
                        limit: { type: 'integer', minimum: 1, maximum: 50 },
                        dataInicio: { type: 'string' },
                        dataFim: { type: 'string' },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const tipo = request.query.tipo === 'destinatario' ? 'destinatario' : 'emitente';
            const metrica = request.query.metrica === 'quantidade' ? 'quantidade' : 'valor';
            const limit = Math.min(request.query.limit ?? 10, 50);
            const rel = tipo === 'emitente' ? '(e:Empresa)-[:EMITIU]->(nf:NotaFiscal)' : '(nf:NotaFiscal)-[:DESTINADA_A]->(e:Empresa)';
            const ordenar = metrica === 'quantidade' ? 'totalNFs' : 'valorTotal';
            const session = driver.session();
            try {
                const res = await session.run(
                    `MATCH ${rel}
                     WITH e, count(nf) AS totalNFs, sum(nf.valorTotal) AS valorTotal
                     RETURN e.cnpj AS cnpj, e.razaoSocial AS razaoSocial, e.uf AS uf, totalNFs, valorTotal
                     ORDER BY ${ordenar} DESC LIMIT toInteger($limit)`,
                    { limit },
                );
                return {
                    tipo,
                    metrica,
                    ranking: res.records.map((r, i) => ({
                        posicao: i + 1,
                        cnpj: r.get('cnpj'),
                        razaoSocial: r.get('razaoSocial'),
                        uf: r.get('uf'),
                        totalNFs: toNum(r.get('totalNFs')),
                        valorTotal: toNum(r.get('valorTotal')),
                    })),
                };
            } finally {
                await session.close();
            }
        },
    );

    // GET /stats/top-produtos — reusa a query do graph
    app.get<{ Querystring: { metrica?: string; limit?: number; ncm?: string; dataInicio?: string; dataFim?: string } }>(
        '/stats/top-produtos',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Ranking de produtos',
                querystring: {
                    type: 'object',
                    properties: {
                        metrica: { type: 'string', enum: ['valor', 'quantidade'] },
                        limit: { type: 'integer', minimum: 1, maximum: 50 },
                        ncm: { type: 'string' },
                        dataInicio: { type: 'string' },
                        dataFim: { type: 'string' },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const metrica = (request.query.metrica === 'quantidade' ? 'quantidade' : 'valor') as MetricaProduto;
            const ranking = await topProducts(driver, {
                metrica,
                ...(request.query.limit ? { limit: Number(request.query.limit) } : {}),
                ...(request.query.ncm ? { ncm: request.query.ncm } : {}),
                ...(request.query.dataInicio ? { dataInicio: request.query.dataInicio } : {}),
                ...(request.query.dataFim ? { dataFim: request.query.dataFim } : {}),
            });
            return { metrica, ranking };
        },
    );

    // GET /stats/produto/:idUnico/historico — evolução do preço médio por mês
    app.get<{ Params: { idUnico: string } }>(
        '/stats/produto/:idUnico/historico',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Histórico de preço médio de um produto',
                params: { type: 'object', properties: { idUnico: { type: 'string' } }, required: ['idUnico'] },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const historico = await productPriceHistory(driver, request.params.idUnico);
            return { idUnico: request.params.idUnico, historico };
        },
    );

    // GET /stats/por-uf — distribuição de NFs e valor por UF do emitente (Treemap do Overview)
    app.get<{ Querystring: { tipo?: string } }>(
        '/stats/por-uf',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Distribuição de NFs por UF',
                querystring: {
                    type: 'object',
                    properties: { tipo: { type: 'string', enum: ['emitente', 'destinatario'] } },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const tipo = request.query.tipo === 'destinatario' ? 'destinatario' : 'emitente';
            const rel = tipo === 'emitente' ? '(e:Empresa)-[:EMITIU]->(nf:NotaFiscal)' : '(nf:NotaFiscal)-[:DESTINADA_A]->(e:Empresa)';
            const session = driver.session();
            try {
                const res = await session.run(
                    `MATCH ${rel}
                     WITH coalesce(e.uf, 'N/D') AS uf, count(nf) AS totalNFs, sum(nf.valorTotal) AS valorTotal
                     RETURN uf, totalNFs, valorTotal
                     ORDER BY totalNFs DESC`,
                );
                return {
                    tipo,
                    porUf: res.records.map((r) => ({
                        uf: r.get('uf'),
                        totalNFs: toNum(r.get('totalNFs')),
                        valorTotal: toNum(r.get('valorTotal')),
                    })),
                };
            } finally {
                await session.close();
            }
        },
    );

    // GET /stats/impostos — KPIs de carga tributária, série temporal e top NCM/CFOP por imposto
    app.get<{ Querystring: { dataInicio?: string; dataFim?: string; uf?: string; limit?: number } }>(
        '/stats/impostos',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Carga tributária: totais por tributo, série temporal e top NCM/CFOP',
                querystring: {
                    type: 'object',
                    properties: {
                        dataInicio: { type: 'string' },
                        dataFim: { type: 'string' },
                        uf: { type: 'string' },
                        limit: { type: 'integer', minimum: 1, maximum: 50 },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const filtros: TaxFilters = {
                ...(request.query.dataInicio ? { dataInicio: request.query.dataInicio } : {}),
                ...(request.query.dataFim ? { dataFim: request.query.dataFim } : {}),
                ...(request.query.uf ? { uf: request.query.uf } : {}),
            };
            const limit = request.query.limit ? Number(request.query.limit) : 10;
            const [resumo, porNcm, porCfop] = await Promise.all([
                taxSummary(driver, filtros),
                taxByNcm(driver, filtros, limit),
                taxByCfop(driver, filtros, limit),
            ]);
            return { totais: resumo.totais, serie: resumo.serie, topNcm: porNcm, topCfop: porCfop };
        },
    );

    // GET /stats/produto/:idUnico/empresas — empresas ligadas ao produto (produto↔empresa)
    app.get<{ Params: { idUnico: string } }>(
        '/stats/produto/:idUnico/empresas',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Empresas ligadas a um produto (emitentes e destinatários)',
                params: { type: 'object', properties: { idUnico: { type: 'string' } }, required: ['idUnico'] },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const empresas = await productCompanies(driver, request.params.idUnico);
            return { idUnico: request.params.idUnico, empresas };
        },
    );

    // GET /stats/fluxo — fluxo de valor agregado entre empresas (Sankey)
    app.get<{ Querystring: { limite?: number } }>(
        '/stats/fluxo',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['stats'],
                summary: 'Fluxo de valor entre empresas (emitente → destinatário), top-N por valor',
                querystring: {
                    type: 'object',
                    properties: { limite: { type: 'integer', minimum: 1, maximum: 100 } },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            return getFluxoEmpresas(driver, {
                ...(request.query.limite ? { limite: Number(request.query.limite) } : {}),
            });
        },
    );
}
