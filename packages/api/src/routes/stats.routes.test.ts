import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { statsRoutes } from './stats.routes.js';

let app: FastifyInstance;
afterEach(async () => app?.close());

describe('GET /stats/overview (unit)', () => {
    it('agrega totais, status e últimas processadas', async () => {
        const responder = (cypher: string) => {
            if (cypher.includes('count(nf) AS totalNFs')) return [rec({ totalNFs: 5, valor: 12345 })];
            if (cypher.includes('(e:Empresa)')) return [rec({ c: 3 })];
            if (cypher.includes('(p:Produto)')) return [rec({ c: 7 })];
            if (cypher.includes('nf.status AS status')) return [rec({ status: 'ativa', c: 5 })];
            return [rec({ chaveAcesso: 'a', numero: '1', valorTotal: 10, processadaEm: 'x' })];
        };
        const { driver } = makeFakeDriver(responder);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/overview' });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        expect(j.totalNFs).toBe(5);
        expect(j.totalEmpresas).toBe(3);
        expect(j.totalProdutos).toBe(7);
        expect(j.nfsPorStatus.ativa).toBe(5);
        expect(j.ultimasProcessadas).toHaveLength(1);
    });
});

describe('GET /stats/volume (unit)', () => {
    it('retorna série por período', async () => {
        const { driver, runs } = makeFakeDriver(() => [rec({ periodo: '2026-06', totalNFs: 2, valorTotal: 100, canceladas: 0 })]);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/volume?granularidade=mes' });
        expect(res.statusCode).toBe(200);
        expect(res.json().serie[0]).toMatchObject({ periodo: '2026-06', totalNFs: 2 });
        // granularidade mes → substring de 7 chars
        expect(runs[0]!.cypher).toContain('substring(nf.dataEmissao, 0, 7)');
    });
});

describe('GET /stats/top-empresas (unit)', () => {
    it('ranking com posição; metrica quantidade ordena por totalNFs', async () => {
        const { driver, runs } = makeFakeDriver(() => [rec({ cnpj: '111', razaoSocial: 'A', uf: 'SP', totalNFs: 9, valorTotal: 90 })]);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/top-empresas?metrica=quantidade&tipo=destinatario' });
        expect(res.statusCode).toBe(200);
        expect(res.json().ranking[0]).toMatchObject({ posicao: 1, cnpj: '111' });
        expect(runs[0]!.cypher).toContain('ORDER BY totalNFs DESC');
        expect(runs[0]!.cypher).toContain('DESTINADA_A');
    });
});

describe('GET /stats/produto/:idUnico/historico (unit)', () => {
    it('retorna idUnico + histórico de preço por período', async () => {
        const { driver, runs } = makeFakeDriver(() => [rec({ periodo: '2026-06', valorTotal: 100, quantidadeTotal: 10, totalNFs: 2 })]);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/produto/p1/historico' });
        expect(res.statusCode).toBe(200);
        expect(res.json().idUnico).toBe('p1');
        expect(res.json().historico[0]).toMatchObject({ periodo: '2026-06', precoMedio: 10, totalNFs: 2 });
        expect(runs[0]!.params.idUnico).toBe('p1');
    });
});

describe('GET /stats/por-uf (unit)', () => {
    it('distribuição por UF do emitente', async () => {
        const { driver } = makeFakeDriver(() => [rec({ uf: 'SP', totalNFs: 4, valorTotal: 400 })]);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/por-uf' });
        expect(res.statusCode).toBe(200);
        expect(res.json().tipo).toBe('emitente');
        expect(res.json().porUf[0]).toEqual({ uf: 'SP', totalNFs: 4, valorTotal: 400 });
    });
});

describe('GET /stats/impostos (unit)', () => {
    it('agrega totais, série e rankings por NCM/CFOP', async () => {
        // roteia cada query (taxSummary totais+série, taxByNcm, taxByCfop) pelo Cypher
        const responder = (cypher: string) => {
            if (cypher.includes('substring(nf.dataEmissao, 0, 7)')) return [rec({ periodo: '2026-06', vICMS: 180, vIPI: 50, vPIS: 16.5, vCOFINS: 76 })];
            if (cypher.includes('AS vFCP')) return [rec({ vICMS: 180, vICMSST: 72, vIPI: 50, vPIS: 16.5, vCOFINS: 76, vII: 0, vFCP: 20 })];
            if (cypher.includes('CLASSIFICADO_EM]->(ncm:NCM)')) return [rec({ ncm: '84713012', descricao: 'Máquinas', vICMS: 252, vIPI: 50, vPIS: 16.5, vCOFINS: 76, totalImposto: 394.5, totalNFs: 1 })];
            if (cypher.includes('c.cfop AS cfop')) return [rec({ cfop: '6102', descricao: 'Venda', tipo: 'saida', vICMS: 180, vIPI: 50, totalNFs: 1 })];
            return [];
        };
        const { driver } = makeFakeDriver(responder);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/impostos?dataInicio=2026-01-01&limit=5' });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        expect(j.totais).toMatchObject({ vICMS: 180, vIPI: 50, vFCP: 20, vICMSST: 72 });
        expect(j.serie[0]).toMatchObject({ periodo: '2026-06', vICMS: 180 });
        expect(j.topNcm[0]).toMatchObject({ ncm: '84713012', totalImposto: 394.5 });
        expect(j.topCfop[0]).toMatchObject({ cfop: '6102', tipo: 'saida' });
    });
});

describe('GET /stats/produto/:idUnico/empresas (unit)', () => {
    it('retorna idUnico + empresas ligadas ao produto', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            rec({ cnpj: '111', razaoSocial: 'Alpha', uf: 'SP', papel: 'emitente', totalNFs: 5, valor: 5000 }),
        ]);
        app = await buildTestApi((a) => statsRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/stats/produto/789/empresas' });
        expect(res.statusCode).toBe(200);
        expect(res.json().idUnico).toBe('789');
        expect(res.json().empresas[0]).toMatchObject({ cnpj: '111', papel: 'emitente', valor: 5000 });
        expect(runs[0]!.params.idUnico).toBe('789');
    });
});
