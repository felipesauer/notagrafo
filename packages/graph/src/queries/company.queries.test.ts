import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { getCompanyStats, getCompanyGraph, DepthForaDoLimiteError } from './company.queries.js';

describe('getCompanyStats (unit)', () => {
    it('agrega contagens e valores do record', async () => {
        const rec = fakeRecord({ emitidas: 3, recebidas: 1, valorEmitido: 4500, primeira: '2026-01-01', ultima: '2026-06-01' });
        const { driver, runs } = makeFakeDriver(() => [rec]);
        const stats = await getCompanyStats(driver, '111');
        expect(stats).toEqual({
            totalNFsEmitidas: 3,
            totalNFsRecebidas: 1,
            valorTotalEmitido: 4500,
            primeiraEmissao: '2026-01-01',
            ultimaEmissao: '2026-06-01',
        });
        expect(runs[0]!.params.cnpj).toBe('111');
    });

    it('sem record → zeros e datas null', async () => {
        const { driver } = makeFakeDriver(() => []);
        const stats = await getCompanyStats(driver, 'x');
        expect(stats.totalNFsEmitidas).toBe(0);
        expect(stats.primeiraEmissao).toBeNull();
    });
});

describe('getCompanyGraph (unit)', () => {
    it('rejeita depth fora de [1,4]', async () => {
        const { driver } = makeFakeDriver(() => []);
        await expect(getCompanyGraph(driver, '111', { depth: 5 })).rejects.toThrow(DepthForaDoLimiteError);
        await expect(getCompanyGraph(driver, '111', { depth: 0 })).rejects.toThrow(DepthForaDoLimiteError);
    });

    it('mapeia nós (1ª query) e arestas (2ª query); grau mínimo 1', async () => {
        const responder = (_c: string, _p: Record<string, unknown>, i: number) =>
            i === 0
                ? [fakeRecord({ cnpj: '222', razaoSocial: 'B', uf: 'MG', grau: 0, totalNFs: 5 })]
                : [fakeRecord({ de: '111', para: '222', totalNFs: 5, valorTotal: 1000 })];
        const { driver, runs } = makeFakeDriver(responder);

        const grafo = await getCompanyGraph(driver, '111', { depth: 2, direction: 'both', limit: 50 });
        expect(grafo.cnpj).toBe('111');
        expect(grafo.depth).toBe(2);
        expect(grafo.nos).toHaveLength(1);
        expect(grafo.nos[0]!.grau).toBe(1); // Math.max(1, 0)
        expect(grafo.arestas).toEqual([{ de: '111', para: '222', totalNFs: 5, valorTotal: 1000 }]);
        // o padrão de caminho usa depth*2 na 1ª query
        expect(runs[0]!.cypher).toContain('*1..4');
    });

    it('direction destinatario muda o padrão de relação', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await getCompanyGraph(driver, '111', { direction: 'destinatario', depth: 1 });
        expect(runs[0]!.cypher).toContain('DESTINADA_A|EMITIU');
    });
});
