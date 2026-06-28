import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { fastifyMultipart } from '@fastify/multipart';
import type { Driver } from 'neo4j-driver';
import type { Queue } from 'bullmq';

// Mocks do graph e worker (vi.hoisted: factories içados ao topo).
const g = vi.hoisted(() => ({
    listNotasFiscais: vi.fn(),
    countNotasFiscais: vi.fn(),
    filtrosAtivos: vi.fn(() => [] as string[]),
    getNotaFiscal: vi.fn(),
}));
const w = vi.hoisted(() => ({
    enqueueNFe: vi.fn(),
    NotaFiscalDuplicadaError: class extends Error {
        chaveAcesso: string;
        constructor(c: string) {
            super(c);
            this.chaveAcesso = c;
        }
    },
}));
vi.mock('@notagrafo/graph', () => g);
vi.mock('@notagrafo/worker', () => w);

import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { makeFakeDriver } from '../__test-helpers__/fake-driver.js';
import { nfRoutes } from './nf.routes.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const xml = readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');
const CHAVE = '35200114200166000187550010000000071234567890';

let app: FastifyInstance;
afterEach(async () => app?.close());
beforeEach(() => {
    Object.values(g).forEach((f) => (f as { mockReset?: () => void }).mockReset?.());
    g.filtrosAtivos.mockReturnValue([]);
    w.enqueueNFe.mockReset();
});

function makeQueue(getJob: (id: string) => unknown): Queue {
    return { getJob: vi.fn(async (id: string) => getJob(id)) } as unknown as Queue;
}
const fakeStorage = (over: Record<string, unknown> = {}) =>
    ({ exists: vi.fn(async () => true), get: vi.fn(async () => xml), save: vi.fn(async () => 'ref'), ...over }) as never;

async function build(queue: Queue, storage = fakeStorage(), driver?: Driver): Promise<FastifyInstance> {
    const d = driver ?? makeFakeDriver(() => []).driver;
    return buildTestApi((a) => nfRoutes(a, { driver: d, queue, storage }));
}

describe('GET /nf (unit)', () => {
    it('retorna data + pagination + meta', async () => {
        g.listNotasFiscais.mockResolvedValue({ data: [{ chaveAcesso: 'a' }], nextCursor: null, limit: 20, hasMore: false });
        g.countNotasFiscais.mockResolvedValue(1);
        g.filtrosAtivos.mockReturnValue(['status']);
        app = await build(makeQueue(() => null));
        const res = await app.inject({ method: 'GET', url: '/nf?status=ativa' });
        expect(res.statusCode).toBe(200);
        expect(res.json().meta).toEqual({ total: 1, filtrosAtivos: ['status'] });
        expect(res.json().pagination.hasMore).toBe(false);
    });
});

describe('GET /nf/:chave (unit)', () => {
    it('200 quando existe', async () => {
        g.getNotaFiscal.mockResolvedValue({ chaveAcesso: CHAVE, numero: '7' });
        app = await build(makeQueue(() => null));
        const res = await app.inject({ method: 'GET', url: `/nf/${CHAVE}` });
        expect(res.statusCode).toBe(200);
        expect(res.json().chaveAcesso).toBe(CHAVE);
    });
    it('404 NF_NOT_FOUND quando não existe', async () => {
        g.getNotaFiscal.mockResolvedValue(null);
        app = await build(makeQueue(() => null));
        const res = await app.inject({ method: 'GET', url: `/nf/${CHAVE}` });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('NF_NOT_FOUND');
    });
});

describe('GET /nf/:chave/xml (unit)', () => {
    it('200 application/xml quando existe no storage', async () => {
        app = await build(makeQueue(() => null), fakeStorage());
        const res = await app.inject({ method: 'GET', url: `/nf/${CHAVE}/xml` });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/xml');
    });
    it('404 quando não existe no storage', async () => {
        app = await build(makeQueue(() => null), fakeStorage({ exists: vi.fn(async () => false) }));
        const res = await app.inject({ method: 'GET', url: `/nf/${CHAVE}/xml` });
        expect(res.statusCode).toBe(404);
    });
});

describe('GET /nf/jobs/:jobId (unit)', () => {
    it('404 quando o job não existe', async () => {
        app = await build(makeQueue(() => null));
        const res = await app.inject({ method: 'GET', url: '/nf/jobs/x' });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('JOB_NOT_FOUND');
    });
    it('completed → total/iniciadoEm/concluidoEm/resultado', async () => {
        const job = { id: CHAVE, progress: 100, processedOn: 1700000000000, finishedOn: 1700000005000, getState: async () => 'completed' };
        app = await build(makeQueue(() => job));
        const res = await app.inject({ method: 'GET', url: `/nf/jobs/${CHAVE}` });
        const j = res.json();
        expect(j.status).toBe('completed');
        expect(j.total).toBe(1);
        expect(j.resultado).toEqual({ processadas: 1, duplicatas: 0, erros: 0 });
        expect(j.iniciadoEm).toBeTruthy();
        expect(j.concluidoEm).toBeTruthy();
    });
    it('failed → erro + tentativas', async () => {
        const job = { id: CHAVE, attemptsMade: 3, failedReason: 'boom', getState: async () => 'failed' };
        app = await build(makeQueue(() => job));
        const res = await app.inject({ method: 'GET', url: `/nf/jobs/${CHAVE}` });
        expect(res.json()).toMatchObject({ status: 'failed', erro: 'boom', tentativas: 3 });
    });

    it.each(['waiting', 'active', 'delayed', 'paused'])('estado não-terminal (%s) → status "processing" com total, sem resultado', async (estado) => {
        const job = { id: CHAVE, progress: 0, getState: async () => estado };
        app = await build(makeQueue(() => job));
        const res = await app.inject({ method: 'GET', url: `/nf/jobs/${CHAVE}` });
        const j = res.json();
        expect(j.status).toBe('processing'); // mapeado do estado cru do BullMQ (contrato §3)
        expect(j.total).toBe(1);
        expect(j.resultado).toBeUndefined();
        expect(j.concluidoEm).toBeUndefined();
    });
});

describe('GET /nf/:chave/eventos (unit)', () => {
    it('retorna chaveAcesso no topo e eventos com timestamp ISO8601', async () => {
        const { driver } = makeFakeDriver(() => [
            { get: (k: string) => ({ tipo: 'consultada', timestamp: '2026-06-01T10:00:00.000Z', autor: 'a@b.com', ipOrigem: '1.2.3.4' }[k]) },
        ]);
        app = await build(makeQueue(() => null), fakeStorage(), driver);
        const res = await app.inject({ method: 'GET', url: `/nf/${CHAVE}/eventos` });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        expect(j.chaveAcesso).toBe(CHAVE);
        expect(j.eventos[0]).toMatchObject({ tipo: 'consultada', autor: 'a@b.com', ipOrigem: '1.2.3.4' });
        expect(new Date(j.eventos[0].timestamp).toISOString()).toBe(j.eventos[0].timestamp);
    });
});

describe('POST /nf/upload validação (unit)', () => {
    async function buildWithMultipart(): Promise<FastifyInstance> {
        const driver = makeFakeDriver(() => []).driver;
        return buildTestApi(async (a) => {
            await a.register(fastifyMultipart);
            await nfRoutes(a, { driver, queue: makeQueue(() => null), storage: fakeStorage() });
        });
    }
    function multipart(content: string, filename = 'nota.xml') {
        const b = '----t';
        const body = `--${b}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/xml\r\n\r\n${content}\r\n--${b}--\r\n`;
        return { body, headers: { 'content-type': `multipart/form-data; boundary=${b}` } };
    }
    const fx = (name: string) => readFileSync(join(FIXTURES, name), 'utf8');

    it('422 INVALID_XML para XML que não passa no XSD', async () => {
        app = await buildWithMultipart();
        const { body, headers } = multipart(fx('nfe-invalida-schema.xml'), 'inv.xml');
        const res = await app.inject({ method: 'POST', url: '/nf/upload', payload: body, headers });
        expect(res.statusCode).toBe(422);
        expect(res.json().error).toBe('INVALID_XML');
    });

    it('422 UNSUPPORTED_SCHEMA_VERSION para versão não suportada', async () => {
        app = await buildWithMultipart();
        const { body, headers } = multipart(fx('nfe-versao-desconhecida.xml'), 'v3.xml');
        const res = await app.inject({ method: 'POST', url: '/nf/upload', payload: body, headers });
        expect(res.statusCode).toBe(422);
        expect(res.json().error).toBe('UNSUPPORTED_SCHEMA_VERSION');
    });
});

describe('POST /nf/upload (unit)', () => {
    async function buildWithMultipart(): Promise<FastifyInstance> {
        const driver = makeFakeDriver(() => []).driver;
        return buildTestApi(async (a) => {
            await a.register(fastifyMultipart);
            await nfRoutes(a, { driver, queue: makeQueue(() => null), storage: fakeStorage() });
        });
    }
    function multipart(content: string, filename = 'nota.xml') {
        const b = '----t';
        const body = `--${b}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/xml\r\n\r\n${content}\r\n--${b}--\r\n`;
        return { body, headers: { 'content-type': `multipart/form-data; boundary=${b}` } };
    }

    it('202 quando o XML é válido e não duplicado', async () => {
        g.getNotaFiscal.mockResolvedValue(null); // checagem de duplicata no handler
        w.enqueueNFe.mockResolvedValue({ jobId: CHAVE, chaveAcesso: CHAVE });
        app = await buildWithMultipart();
        const { body, headers } = multipart(xml);
        const res = await app.inject({ method: 'POST', url: '/nf/upload', payload: body, headers });
        expect(res.statusCode).toBe(202);
        expect(res.json()).toMatchObject({ status: 'queued', arquivos: 1 });
    });

    it('409 quando a NF já existe no grafo (checagem atômica)', async () => {
        g.getNotaFiscal.mockResolvedValue({ chaveAcesso: CHAVE });
        app = await buildWithMultipart();
        const { body, headers } = multipart(xml);
        const res = await app.inject({ method: 'POST', url: '/nf/upload', payload: body, headers });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('DUPLICATE_NF');
    });
});
