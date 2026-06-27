import Fastify, { type FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import { errorHandler, ApiError } from './errors.js';
import { requestIdPlugin, genReqId } from './plugins/request-id.plugin.js';
import { swaggerPlugin } from './plugins/swagger.plugin.js';
import { rateLimitPlugin } from './plugins/rate-limit.plugin.js';
import { authPlugin } from './auth/auth.plugin.js';
import { authRoutes } from './auth/auth.routes.js';
import { metricsPlugin } from './plugins/metrics.plugin.js';
import { loggerConfig } from './observability/logger.js';

export interface BuildAppOptions {
    /** Desabilita rate-limit (útil em testes que não querem Redis para isso). */
    rateLimit?: boolean;
    logger?: boolean;
    /** Driver Neo4j — habilita as rotas de auth quando presente. */
    driver?: Driver;
}

/** Prefixo de versão de todas as rotas de negócio. */
export const API_PREFIX = '/api/v1';

/**
 * Monta a instância Fastify com os plugins base, error handler padrão e o
 * prefixo /api/v1. As rotas de negócio são registradas nas tasks seguintes.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
    const app = Fastify({
        genReqId,
        logger: opts.logger ? loggerConfig() : false,
        ajv: { customOptions: { allErrors: true } },
    });

    app.setErrorHandler(errorHandler);

    // Plugins base
    await app.register(requestIdPlugin);
    await app.register(swaggerPlugin);
    await app.register(metricsPlugin);
    if (opts.rateLimit !== false) {
        await app.register(rateLimitPlugin);
    }

    // 404 no envelope padrão
    app.setNotFoundHandler((request, reply) => {
        errorHandler(
            new ApiError(404, 'NOT_FOUND', `Rota ${request.method} ${request.url} não encontrada.`),
            request,
            reply,
        );
    });

    // Auth (JWT manual — ADR NOTA-ADR-1) quando há driver Neo4j.
    if (opts.driver) {
        await app.register(authPlugin);
    }

    // Rotas sob o prefixo /api/v1.
    await app.register(
        async (api) => {
            api.get('/ping', { schema: { tags: ['health'], summary: 'Ping', response: { 200: { type: 'object', properties: { pong: { type: 'boolean' } } } } } }, async () => ({ pong: true }));
            if (opts.driver) {
                await authRoutes(api, opts.driver);
            }
        },
        { prefix: API_PREFIX },
    );

    return app;
}
