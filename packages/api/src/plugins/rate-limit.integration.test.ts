import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { buildApp, API_PREFIX } from '../app.js';

let container: StartedRedisContainer;
let app: FastifyInstance;

beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    process.env.REDIS_URL = container.getConnectionUrl();
    process.env.RATE_LIMIT_MAX = '3';
    process.env.RATE_LIMIT_WINDOW = '60000';
    app = await buildApp({ rateLimit: true });
    await app.ready();
}, 120_000);

afterAll(async () => {
    await app?.close();
    await container?.stop();
    delete process.env.RATE_LIMIT_MAX;
});

describe('rate limit com Redis real', () => {
    it('retorna 429 RATE_LIMIT_EXCEEDED após exceder o limite', async () => {
        const url = `${API_PREFIX}/ping`;
        // 3 requisições dentro do limite
        for (let i = 0; i < 3; i++) {
            const ok = await app.inject({ method: 'GET', url });
            expect(ok.statusCode).toBe(200);
        }
        // a 4ª excede
        const blocked = await app.inject({ method: 'GET', url });
        expect(blocked.statusCode).toBe(429);
        expect(blocked.json()).toMatchObject({ error: 'RATE_LIMIT_EXCEEDED' });
        expect(blocked.json().requestId).toBeTruthy();
    });
});
