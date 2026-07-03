import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { getFluxoEmpresas } from './flow.queries.js';

describe('getFluxoEmpresas (unit)', () => {
    it('mapeia os pares emitente→destinatário com nome e valores', async () => {
        const recs = [
            fakeRecord({ de: '111', para: '222', deNome: 'Alpha', paraNome: 'Beta', totalNFs: 5, valorTotal: 9000 }),
            fakeRecord({ de: '111', para: '333', deNome: 'Alpha', paraNome: 'Gama', totalNFs: 2, valorTotal: 1500 }),
        ];
        const { driver, runs } = makeFakeDriver(() => recs);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.arestas).toEqual([
            { de: '111', para: '222', deNome: 'Alpha', paraNome: 'Beta', totalNFs: 5, valorTotal: 9000 },
            { de: '111', para: '333', deNome: 'Alpha', paraNome: 'Gama', totalNFs: 2, valorTotal: 1500 },
        ]);
        // ignora laços e ordena por valor desc
        expect(runs[0]!.cypher).toContain('a.cnpj <> b.cnpj');
        expect(runs[0]!.cypher).toContain('ORDER BY valorTotal DESC');
    });

    it('aplica o limite padrão (30) e o repassa como parâmetro', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.limite).toBe(30);
        // neo4j.int(30) tem toNumber() === 30
        expect((runs[0]!.params.limite as { toNumber: () => number }).toNumber()).toBe(30);
    });

    it('faz clamp do limite em [1,100]', async () => {
        const { driver: d1 } = makeFakeDriver(() => []);
        expect((await getFluxoEmpresas(d1, { limite: 999 })).limite).toBe(100);
        const { driver: d2 } = makeFakeDriver(() => []);
        expect((await getFluxoEmpresas(d2, { limite: 0 })).limite).toBe(1);
    });

    it('nome nulo vira string vazia', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ de: '111', para: '222', deNome: null, paraNome: null, totalNFs: 1, valorTotal: 10 }),
        ]);
        const fluxo = await getFluxoEmpresas(driver);
        expect(fluxo.arestas[0]!.deNome).toBe('');
        expect(fluxo.arestas[0]!.paraNome).toBe('');
    });
});
