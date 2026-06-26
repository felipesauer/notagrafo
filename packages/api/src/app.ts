import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler, ApiError } from './errors.js';
import { requestIdPlugin, genReqId } from './plugins/request-id.plugin.js';
import { swaggerPlugin } from './plugins/swagger.plugin.js';
import { rateLimitPlugin } from './plugins/rate-limit.plugin.js';

export interface BuildAppOptions {
    /** Desabilita rate-limit (útil em testes que não querem Redis para isso). */
    rateLimit?: boolean;
    logger?: boolean;
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
        logger: opts.logger ?? false,
        ajv: { customOptions: { allErrors: true } },
    });

    app.setErrorHandler(errorHandler);

    // Plugins base
    await app.register(requestIdPlugin);
    await app.register(swaggerPlugin);
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

    // Rota de sanidade sob o prefixo (as demais rotas chegam nas próximas tasks).
    await app.register(
        async (api) => {
            api.get('/ping', { schema: { tags: ['health'], summary: 'Ping', response: { 200: { type: 'object', properties: { pong: { type: 'boolean' } } } } } }, async () => ({ pong: true }));
        },
        { prefix: API_PREFIX },
    );

    return app;
}
