import { describe, it, expect, vi, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { exportRoutes } from './export.routes.js';
import type { ExportService, ExportJob } from './export.service.js';

let app: FastifyInstance;
afterEach(async () => app?.close());

function fakeService(over: Partial<ExportService>): ExportService {
    return {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(() => []),
        read: vi.fn(),
        contentType: vi.fn(() => 'application/json'),
        ...over,
    } as unknown as ExportService;
}
const job = (over: Partial<ExportJob> = {}): ExportJob =>
    ({ exportId: 'exp_1', formato: 'json', status: 'ready', progresso: 0, total: 0, totalRegistros: 5, tamanhoBytes: 100, expiresAt: Date.now() + 3600_000, filePath: '/x', ...over }) as ExportJob;

describe('POST /export (unit)', () => {
    it('202 com exportId', async () => {
        const svc = fakeService({ create: vi.fn(() => job({ status: 'queued' })) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'POST', url: '/export', payload: { formato: 'json' } });
        expect(res.statusCode).toBe(202);
        expect(res.json().exportId).toBe('exp_1');
    });
});

describe('GET /export (lista/histórico) (unit)', () => {
    it('200 com a lista de exportações (mais recentes primeiro), com downloadUrl nas ready', async () => {
        const svc = fakeService({
            list: vi.fn(() => [job({ exportId: 'exp_2', status: 'ready' }), job({ exportId: 'exp_1', status: 'failed', erro: 'x' })]),
        });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export' });
        expect(res.statusCode).toBe(200);
        const data = res.json().data as Array<Record<string, unknown>>;
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({ exportId: 'exp_2', status: 'ready', downloadUrl: '/api/v1/export/exp_2/download' });
        expect(data[1]).toMatchObject({ exportId: 'exp_1', status: 'failed', erro: 'x' });
        expect(data[1]).not.toHaveProperty('downloadUrl');
    });

    it('200 com lista vazia quando não há exportações', async () => {
        const svc = fakeService({ list: vi.fn(() => []) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export' });
        expect(res.statusCode).toBe(200);
        expect(res.json().data).toEqual([]);
    });
});

describe('GET /export/:id (unit)', () => {
    it('200 ready com downloadUrl', async () => {
        const svc = fakeService({ get: vi.fn(async () => job({ status: 'ready' })) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/exp_1' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({ status: 'ready', downloadUrl: '/api/v1/export/exp_1/download' });
    });

    it('200 processing com progresso/total', async () => {
        const svc = fakeService({ get: vi.fn(async () => job({ status: 'processing', progresso: 2, total: 10 })) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/exp_1' });
        expect(res.json()).toMatchObject({ status: 'processing', progresso: 2, total: 10 });
    });

    it('404 quando não existe', async () => {
        const svc = fakeService({ get: vi.fn(async () => null) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/nope' });
        expect(res.statusCode).toBe(404);
    });

    it('410 quando expirou', async () => {
        const svc = fakeService({ get: vi.fn(async () => 'expired' as const) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/exp_1' });
        expect(res.statusCode).toBe(410);
        expect(res.json().error).toBe('EXPORT_EXPIRED');
    });
});

describe('GET /export/:id/download (unit)', () => {
    it('serve o arquivo quando ready', async () => {
        const svc = fakeService({
            get: vi.fn(async () => job({ status: 'ready' })),
            read: vi.fn(async () => Buffer.from('[]')),
        });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/exp_1/download' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('400 quando ainda não está pronto', async () => {
        const svc = fakeService({ get: vi.fn(async () => job({ status: 'processing' })) });
        app = await buildTestApi((a) => exportRoutes(a, svc));
        const res = await app.inject({ method: 'GET', url: '/export/exp_1/download' });
        expect(res.statusCode).toBe(400);
    });
});
