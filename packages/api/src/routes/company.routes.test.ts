import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

const g = vi.hoisted(() => ({ getCompanyStats: vi.fn(), getCompanyGraph: vi.fn() }));
vi.mock('@notagrafo/graph', () => g);

import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { companyRoutes } from './company.routes.js';

let app: FastifyInstance;
afterEach(async () => app?.close());
beforeEach(() => Object.values(g).forEach((f) => f.mockReset()));

describe('GET /empresa/:cnpj (unit)', () => {
    it('200 com dados + stats quando a empresa existe', async () => {
        const { driver } = makeFakeDriver(() => [rec({ e: { properties: { cnpj: '111', razaoSocial: 'A' } } })]);
        g.getCompanyStats.mockResolvedValue({ totalNFsEmitidas: 2 });
        app = await buildTestApi((a) => companyRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/empresa/111' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({ cnpj: '111', stats: { totalNFsEmitidas: 2 } });
    });

    it('404 EMPRESA_NOT_FOUND quando não existe', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => companyRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/empresa/999' });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('EMPRESA_NOT_FOUND');
    });
});

describe('GET /empresa/:cnpj/graph (unit)', () => {
    it('400 quando depth fora de [1,4]', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => companyRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/empresa/111/graph?depth=9' });
        expect(res.statusCode).toBe(400);
    });

    it('200 delega ao getCompanyGraph com depth/direction/limit', async () => {
        const { driver } = makeFakeDriver(() => []);
        g.getCompanyGraph.mockResolvedValue({ cnpj: '111', depth: 2, nos: [], arestas: [] });
        app = await buildTestApi((a) => companyRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/empresa/111/graph?depth=2&direction=emitente&limit=10' });
        expect(res.statusCode).toBe(200);
        expect(g.getCompanyGraph).toHaveBeenCalledWith(driver, '111', { depth: 2, direction: 'emitente', limit: 10 });
    });

    it('repassa includeProdutos=true (coagido) ao getCompanyGraph', async () => {
        const { driver } = makeFakeDriver(() => []);
        g.getCompanyGraph.mockResolvedValue({ cnpj: '111', depth: 1, nos: [], arestas: [], produtos: [] });
        app = await buildTestApi((a) => companyRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/empresa/111/graph?includeProdutos=true' });
        expect(res.statusCode).toBe(200);
        expect(g.getCompanyGraph).toHaveBeenCalledWith(driver, '111', { depth: 1, includeProdutos: true });
    });
});
