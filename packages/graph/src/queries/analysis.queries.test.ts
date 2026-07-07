import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { getPeriodComparison, findDuplicateInvoices, findNumberingGaps } from './analysis.queries.js';

describe('getPeriodComparison (unit, driver fake)', () => {
    it('computes current/previous/YoY and the changes, with correct date windows', async () => {
        // 3 sequential queries: 0=current, 1=previous, 2=YoY.
        const answers = [
            { totalNFs: 120, valorTotal: 6000 }, // current
            { totalNFs: 100, valorTotal: 5000 }, // previous
            { totalNFs: 80, valorTotal: 4000 }, // year ago
        ];
        const { driver, runs } = makeFakeDriver((_c, _p, i) => [fakeRecord(answers[i]!)]);

        const out = await getPeriodComparison(driver, '2026-06-01', '2026-06-30'); // 30 days

        expect(out.current).toEqual({ totalNFs: 120, valorTotal: 6000 });
        expect(out.previous).toEqual({ totalNFs: 100, valorTotal: 5000 });
        expect(out.yearAgo).toEqual({ totalNFs: 80, valorTotal: 4000 });
        // changes: (120-100)/100 = 0.2 ; (6000-5000)/5000 = 0.2
        expect(out.changeVsPrevious.totalNFs).toBeCloseTo(0.2, 5);
        expect(out.changeVsPrevious.valorTotal).toBeCloseTo(0.2, 5);
        // YoY: (120-80)/80 = 0.5
        expect(out.changeVsYearAgo.totalNFs).toBeCloseTo(0.5, 5);

        // windows: previous ends 2026-05-31 and is 30 days long → starts 2026-05-02
        const pPrev = runs[1]!.params as { start: string; end: string };
        expect(pPrev.start).toBe('2026-05-02');
        expect(pPrev.end.startsWith('2026-05-31')).toBe(true);
        // YoY: same interval, 365 days earlier
        const pYoy = runs[2]!.params as { start: string; end: string };
        expect(pYoy.start).toBe('2025-06-01');
        expect(pYoy.end.startsWith('2025-06-30')).toBe(true);
    });

    it('change is undefined when the baseline is zero (avoids division by zero)', async () => {
        const { driver } = makeFakeDriver((_c, _p, i) =>
            [fakeRecord(i === 0 ? { totalNFs: 10, valorTotal: 500 } : { totalNFs: 0, valorTotal: 0 })],
        );
        const out = await getPeriodComparison(driver, '2026-06-01', '2026-06-30');
        expect(out.changeVsPrevious.totalNFs).toBeUndefined();
        expect(out.changeVsYearAgo.valorTotal).toBeUndefined();
    });
});

describe('findDuplicateInvoices (unit, driver fake)', () => {
    it('mapeia grupos de duplicatas e exclui devoluções na query', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ cnpjEmitente: '111', razaoSocial: 'Emp', dataEmissao: '2026-06-01', valorTotal: 500, count: 3, chaves: ['a', 'b', 'c'] }),
        ]);
        const out = await findDuplicateInvoices(driver, 10);
        expect(out[0]).toEqual({ cnpjEmitente: '111', razaoSocial: 'Emp', dataEmissao: '2026-06-01', valorTotal: 500, count: 3, chaves: ['a', 'b', 'c'] });
        // heurística: mesmo dia+valor, 2+ NF, sem devolução
        expect(runs[0]!.cypher).toContain("coalesce(nf.finalidade, '') <> 'devolucao'");
        expect(runs[0]!.cypher).toContain('size(chaves) >= 2');
    });
});

describe('findNumberingGaps (unit, driver fake)', () => {
    it('mapeia gaps de numeração (from/to/missing) e só considera nNF numérico', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ cnpjEmitente: '111', razaoSocial: 'Emp', serie: '1', from: 100, to: 103, missing: 2 }),
        ]);
        const out = await findNumberingGaps(driver, 10);
        expect(out[0]).toEqual({ cnpjEmitente: '111', razaoSocial: 'Emp', serie: '1', from: 100, to: 103, missing: 2 });
        expect(runs[0]!.cypher).toContain("nf.numero =~ '\\\\d+'"); // só numérico
        expect(runs[0]!.cypher).toContain('b - a > 1'); // detecta o salto
    });
});
