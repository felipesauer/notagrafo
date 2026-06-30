import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { taxSummary, taxByNcm, taxByCfop } from './tax.queries.js';

describe('taxSummary (unit)', () => {
    it('soma totais por tributo e monta a série mensal', async () => {
        // call 0 = totais; call 1 = série
        const responder = (_c: string, _p: Record<string, unknown>, i: number) =>
            i === 0
                ? [fakeRecord({ vICMS: 180, vICMSST: 72, vIPI: 50, vPIS: 16.5, vCOFINS: 76, vII: 0, vFCP: 20 })]
                : [
                      fakeRecord({ periodo: '2026-05', vICMS: 100, vIPI: 30, vPIS: 10, vCOFINS: 40 }),
                      fakeRecord({ periodo: '2026-06', vICMS: 80, vIPI: 20, vPIS: 6.5, vCOFINS: 36 }),
                  ];
        const { driver } = makeFakeDriver(responder);
        const out = await taxSummary(driver, {});
        expect(out.totais).toEqual({ vICMS: 180, vICMSST: 72, vIPI: 50, vPIS: 16.5, vCOFINS: 76, vII: 0, vFCP: 20 });
        expect(out.serie).toHaveLength(2);
        expect(out.serie[0]).toEqual({ periodo: '2026-05', vICMS: 100, vIPI: 30, vPIS: 10, vCOFINS: 40 });
    });

    it('sem filtro de UF não liga o emitente; com UF liga e parametriza', async () => {
        const sem = makeFakeDriver(() => []);
        await taxSummary(sem.driver, { dataInicio: '2026-01-01' });
        expect(sem.runs[0]!.cypher).toContain('MATCH (nf:NotaFiscal)');
        expect(sem.runs[0]!.cypher).not.toContain('EMITIU');
        expect(sem.runs[0]!.cypher).toContain('nf.dataEmissao >= $dataInicio');

        const com = makeFakeDriver(() => []);
        await taxSummary(com.driver, { uf: 'SP' });
        expect(com.runs[0]!.cypher).toContain('(e:Empresa)-[:EMITIU]->(nf:NotaFiscal)');
        expect(com.runs[0]!.params).toMatchObject({ uf: 'SP' });
    });
});

describe('taxByNcm (unit)', () => {
    it('agrega por NCM via CONTÉM, soma ICMS+ICMS-ST e ordena por totalImposto', async () => {
        const rows = [
            fakeRecord({ ncm: '84713012', descricao: 'Máquinas', vICMS: 252, vIPI: 50, vPIS: 16.5, vCOFINS: 76, totalImposto: 394.5, totalNFs: 3 }),
            fakeRecord({ ncm: '61091000', descricao: null, vICMS: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, totalImposto: 0, totalNFs: 1 }),
        ];
        const { driver, runs } = makeFakeDriver(() => rows);
        const out = await taxByNcm(driver, {}, 5);
        expect(runs[0]!.cypher).toContain('-[c:CONTÉM]->(:Produto)-[:CLASSIFICADO_EM]->(ncm:NCM)');
        expect(runs[0]!.cypher).toContain('ORDER BY totalImposto DESC');
        expect(out[0]).toMatchObject({ ncm: '84713012', descricao: 'Máquinas', totalImposto: 394.5 });
        expect(out[1]).not.toHaveProperty('descricao'); // descrição nula omitida
    });

    it('clampa o limit no máximo (50)', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        await taxByNcm(driver, {}, 999);
        // limit vira neo4j.int(50) — checamos via toNumber do Integer
        const lim = runs[0]!.params.limit as { toNumber(): number };
        expect(lim.toNumber()).toBe(50);
    });
});

describe('taxByCfop (unit)', () => {
    it('agrega por c.cfop da aresta CONTÉM (granular, sem double-count) e exclui devolução/stub', async () => {
        const rows = [fakeRecord({ cfop: '6102', descricao: 'Venda interestadual', tipo: 'saida', vICMS: 180, vIPI: 50, totalNFs: 2 })];
        const { driver, runs } = makeFakeDriver(() => rows);
        const out = await taxByCfop(driver, { uf: 'SP' }, 10);
        // agrega pelo CFOP do ITEM (não USA_CFOP/total_* da NF — evita B1)
        expect(runs[0]!.cypher).toContain('-[c:CONTÉM]->(:Produto)');
        expect(runs[0]!.cypher).toContain('c.cfop AS cfop');
        expect(runs[0]!.cypher).toContain('(e:Empresa)-[:EMITIU]->(nf)');
        // exclui stub e devolução
        expect(runs[0]!.cypher).toContain('nf.status IS NOT NULL');
        expect(runs[0]!.cypher).toContain("<> 'devolucao'");
        expect(out[0]).toMatchObject({ cfop: '6102', tipo: 'saida', vICMS: 180, totalNFs: 2 });
    });
});
