import fp from 'fastify-plugin';
import { fastifyRateLimit } from '@fastify/rate-limit';
import { Redis } from 'ioredis';
import { ApiError } from '../errors.js';

/**
 * Rate limiting com store no Redis (seção 8 do 02 contratos api.md).
 * RATE_LIMIT_MAX requisições por RATE_LIMIT_WINDOW ms. Excedeu → 429.
 */
export const rateLimitPlugin = fp(async (app) => {
    const max = Number(process.env.RATE_LIMIT_MAX ?? '100');
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW ?? '60000');
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        connectionName: 'notagrafo-ratelimit',
    });

    await app.register(fastifyRateLimit, {
        max,
        timeWindow: windowMs,
        redis,
        errorResponseBuilder: () => {
            // Lançar o ApiError para o errorHandler montar o envelope padrão.
            throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em instantes.');
        },
    });
}, { name: 'rate-limit' });
