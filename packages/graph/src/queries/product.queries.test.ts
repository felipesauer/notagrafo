import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { topProducts, productPriceHistory } from './product.queries.js';

describe('topProducts (unit)', () => {
    it('mapeia ranking com posição e preço médio; omite ean nulo', async () => {
        const rows = [
            fakeRecord({ idUnico: 'p1', descricao: 'A', ean: '789', ncm: '6109', totalNFs: 2, quantidadeTotal: 4, valorTotal: 40 }),
            fakeRecord({ idUnico: 'p2', descricao: 'B', ean: null, ncm: '6110', totalNFs: 1, quantidadeTotal: 0, valorTotal: 0 }),
        ];
        const { driver, runs } = makeFakeDriver(() => rows);
        const ranking = await topProducts(driver, { metrica: 'valor', limit: 10 });
        expect(ranking[0]).toMatchObject({ posicao: 1, idUnico: 'p1', ean: '789', precoMedio: 10 });
        expect(ranking[1]!.posicao).toBe(2);
        expect(ranking[1]).not.toHaveProperty('ean'); // ean nulo omitido
        expect(ranking[1]!.precoMedio).toBe(0); // divisão por zero protegida
        expect(runs[0]!.cypher).toContain('ORDER BY valorTotal DESC');
    });

    it('metrica quantidade ordena por quantidadeTotal e aplica filtros ncm/data', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await topProducts(driver, { metrica: 'quantidade', ncm: '6109', dataInicio: '2026-01-01', dataFim: '2026-12-31' });
        expect(runs[0]!.cypher).toContain('ORDER BY quantidadeTotal DESC');
        expect(runs[0]!.cypher).toContain('STARTS WITH $ncm');
        expect(runs[0]!.params).toMatchObject({ ncm: '6109', dataInicio: '2026-01-01', dataFim: '2026-12-31' });
    });
});

describe('productPriceHistory (unit)', () => {
    it('calcula preço médio por período e ordena ascendente', async () => {
        const rows = [
            fakeRecord({ periodo: '2026-05', valorTotal: 100, quantidadeTotal: 10, totalNFs: 2 }),
            fakeRecord({ periodo: '2026-06', valorTotal: 0, quantidadeTotal: 0, totalNFs: 1 }),
        ];
        const { driver, runs } = makeFakeDriver(() => rows);
        const hist = await productPriceHistory(driver, 'p1');
        expect(hist[0]).toEqual({ periodo: '2026-05', precoMedio: 10, quantidadeTotal: 10, totalNFs: 2 });
        expect(hist[1]!.precoMedio).toBe(0);
        expect(runs[0]!.params.idUnico).toBe('p1');
        expect(runs[0]!.cypher).toContain('ORDER BY periodo ASC');
    });

    it('produto sem histórico → []', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await productPriceHistory(driver, 'nope')).toEqual([]);
    });
});
