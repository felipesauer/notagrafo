import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import neo4j, { type Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import { runMigrations } from '@notagrafo/graph';
import { createNFQueue, processNFe, LocalXmlStorage } from '@notagrafo/worker';
import { buildApp, API_PREFIX } from '../app.js';
import { criarUsuario } from '../auth/user.repository.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const EMIT = '14200166000187';

let neo4jC: StartedNeo4jContainer;
let redisC: StartedRedisContainer;
let driver: Driver;
let redis: Redis;
let app: FastifyInstance;
let token: string;
const tmp = mkdtempSync(join(tmpdir(), 'nfp-routes20-'));

const xml = (): string => readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');
const bearer = (): Record<string, string> => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
    [neo4jC, redisC] = await Promise.all([
        new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start(),
        new RedisContainer('redis:7-alpine').start(),
    ]);
    driver = neo4j.driver(neo4jC.getBoltUri(), neo4j.auth.basic(neo4jC.getUsername(), neo4jC.getPassword()));
    redis = new Redis(redisC.getConnectionUrl(), { maxRetriesPerRequest: null });
    const storage = new LocalXmlStorage(tmp);
    const queue = createNFQueue(redis);
    process.env.AUTH_SECRET = 'test-secret';
    await runMigrations(driver);
    await criarUsuario(driver, { email: 'u@e.com', nome: 'U', senha: 'p' });
    await processNFe({ xml: xml() }, { driver, storage });
    app = await buildApp({ rateLimit: false, driver, queue, storage, redis });
    await app.ready();
    token = (await app.inject({ method: 'POST', url: `${API_PREFIX}/auth/login`, payload: { email: 'u@e.com', password: 'p' } })).json().token;
}, 180_000);

afterAll(async () => {
    await app?.close();
    await redis?.quit();
    await driver?.close();
    await Promise.all([neo4jC?.stop(), redisC?.stop()]);
    rmSync(tmp, { recursive: true, force: true });
});

describe('GET /health (sem auth)', () => {
    it('retorna 200 com services ok e xsdVersions', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.services).toEqual({ neo4j: 'ok', redis: 'ok', storage: 'ok' });
        expect(body.xsdVersions).toContain('4.00');
    });
});

describe('empresa', () => {
    it('GET /empresa/:cnpj retorna dados + stats', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/empresa/${EMIT}`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(res.json().cnpj).toBe(EMIT);
        expect(res.json().stats.totalNFsEmitidas).toBe(1);
    });

    it('GET /empresa/:cnpj/grafo com depth>4 → 400 BAD_REQUEST', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/empresa/${EMIT}/grafo?depth=5`, headers: bearer() });
        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe('BAD_REQUEST');
    });

    it('GET /empresa/:cnpj/grafo depth válido → 200', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/empresa/${EMIT}/grafo?depth=2`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(res.json().depth).toBe(2);
    });
});

describe('stats', () => {
    it('GET /stats/overview retorna KPIs coerentes', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/stats/overview`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(res.json().totalNFs).toBe(1);
        expect(res.json().valorTotalProcessado).toBeGreaterThan(0);
        expect(res.json().nfsPorStatus.ativa).toBe(1);
    });

    it('GET /stats/volume retorna série', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/stats/volume?granularidade=mes`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.json().serie)).toBe(true);
    });

    it('GET /stats/top-empresas e top-produtos retornam ranking', async () => {
        const emp = await app.inject({ method: 'GET', url: `${API_PREFIX}/stats/top-empresas`, headers: bearer() });
        expect(emp.statusCode).toBe(200);
        expect(emp.json().ranking[0].cnpj).toBe(EMIT);
        const prod = await app.inject({ method: 'GET', url: `${API_PREFIX}/stats/top-produtos`, headers: bearer() });
        expect(prod.statusCode).toBe(200);
        expect(prod.json().ranking.length).toBeGreaterThanOrEqual(1);
    });
});

describe('export (fluxo assíncrono)', () => {
    it('POST /export → 202; GET acompanha até ready; download serve CSV', async () => {
        const post = await app.inject({ method: 'POST', url: `${API_PREFIX}/export`, headers: bearer(), payload: { formato: 'csv' } });
        expect(post.statusCode).toBe(202);
        const exportId = post.json().exportId;
        expect(exportId).toBeTruthy();

        // aguarda a geração (background)
        let status = '';
        for (let i = 0; i < 20 && status !== 'ready'; i++) {
            await new Promise((r) => setTimeout(r, 150));
            const get = await app.inject({ method: 'GET', url: `${API_PREFIX}/export/${exportId}`, headers: bearer() });
            status = get.json().status;
        }
        expect(status).toBe('ready');

        const dl = await app.inject({ method: 'GET', url: `${API_PREFIX}/export/${exportId}/download`, headers: bearer() });
        expect(dl.statusCode).toBe(200);
        expect(dl.headers['content-type']).toContain('text/csv');
        expect(dl.headers['content-disposition']).toContain('attachment');
        expect(dl.body).toContain('chaveAcesso');
    });

    it('GET /export/:id inexistente → 404', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/export/exp_inexistente`, headers: bearer() });
        expect(res.statusCode).toBe(404);
    });
});
