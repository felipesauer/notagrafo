import { describe, it, expect, vi, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import { makeFakeDriver } from '../__test-helpers__/fake-driver.js';
import { healthRoutes } from './health.routes.js';

let app: FastifyInstance;
afterEach(async () => app?.close());

const fakeRedis = (pong: boolean): Redis => ({ ping: vi.fn(async () => (pong ? 'PONG' : 'NOPE')) }) as unknown as Redis;
const fakeStorage = (ok: boolean) => ({ exists: vi.fn(async () => { if (!ok) throw new Error('down'); return false; }) }) as never;

async function build(deps: Parameters<typeof healthRoutes>[1]): Promise<FastifyInstance> {
    const a = Fastify();
    await healthRoutes(a, deps);
    await a.ready();
    return a;
}

describe('GET /health (unit)', () => {
    it('200 ok quando todos os serviços respondem', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await build({ driver, redis: fakeRedis(true), storage: fakeStorage(true) });
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        expect(res.json().status).toBe('ok');
        expect(res.json().services).toEqual({ neo4j: 'ok', redis: 'ok', storage: 'ok' });
        expect(Array.isArray(res.json().xsdVersions)).toBe(true);
    });

    it('503 degraded quando o Redis não responde PONG', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await build({ driver, redis: fakeRedis(false), storage: fakeStorage(true) });
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(503);
        expect(res.json().status).toBe('degraded');
        expect(res.json().services.redis).toBe('down');
    });

    it('503 quando o storage lança', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await build({ driver, redis: fakeRedis(true), storage: fakeStorage(false) });
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(503);
        expect(res.json().services.storage).toBe('down');
    });
});
