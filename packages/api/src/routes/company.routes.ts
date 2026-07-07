import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import { getCompanyStats, getCompanyGraph, type Direction } from '@notagrafo/graph';
import { ApiError } from '../errors.js';

export async function companyRoutes(app: FastifyInstance, driver: Driver): Promise<void> {
    // GET /empresa/:cnpj — dados + stats
    app.get<{ Params: { cnpj: string } }>(
        '/empresa/:cnpj',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['empresa'],
                summary: 'Dados e estatísticas de uma empresa',
                params: { type: 'object', properties: { cnpj: { type: 'string' } }, required: ['cnpj'] },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const { cnpj } = request.params;
            const session = driver.session();
            let empresa: Record<string, unknown> | null = null;
            try {
                const res = await session.run(
                    `MATCH (e:Empresa {cnpj: $cnpj}) RETURN e`,
                    { cnpj },
                );
                const node = res.records[0]?.get('e') as { properties: Record<string, unknown> } | undefined;
                empresa = node?.properties ?? null;
            } finally {
                await session.close();
            }
            if (!empresa) throw ApiError.notFound('EMPRESA_NOT_FOUND', 'Empresa não encontrada.');

            const stats = await getCompanyStats(driver, cnpj);
            return { ...empresa, stats };
        },
    );

    // GET /empresa/:cnpj/graph — vizinhos; depth máx 4 (regra 6 → 400 antes da query)
    app.get<{ Params: { cnpj: string }; Querystring: { depth?: number; direction?: Direction; limit?: number; includeProdutos?: boolean; includeNotas?: boolean } }>(
        '/empresa/:cnpj/graph',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['empresa'],
                summary: 'Vizinhos da empresa no grafo',
                params: { type: 'object', properties: { cnpj: { type: 'string' } }, required: ['cnpj'] },
                querystring: {
                    type: 'object',
                    properties: {
                        depth: { type: 'integer' },
                        direction: { type: 'string', enum: ['emitente', 'destinatario', 'both'] },
                        limit: { type: 'integer', minimum: 1, maximum: 500 },
                        includeProdutos: { type: 'boolean' },
                        includeNotas: { type: 'boolean' },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const { cnpj } = request.params;
            const depth = request.query.depth ?? 1;
            if (depth < 1 || depth > 4) {
                throw ApiError.badRequest('Parâmetro depth deve estar entre 1 e 4.', [`depth=${depth}`]);
            }
            return getCompanyGraph(driver, cnpj, {
                depth,
                ...(request.query.direction ? { direction: request.query.direction } : {}),
                ...(request.query.limit ? { limit: Number(request.query.limit) } : {}),
                ...(request.query.includeProdutos ? { includeProdutos: true } : {}),
                ...(request.query.includeNotas ? { includeNotas: true } : {}),
            });
        },
    );
}
