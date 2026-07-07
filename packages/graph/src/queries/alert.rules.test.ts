import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import {
    evaluateAlerts,
    mergeAlertConfig,
    DEFAULT_ALERT_CONFIG,
    type AlertConfig,
} from './alert.rules.js';

/** Config with a single rule enabled, everything else off. */
function onlyRule(rule: keyof AlertConfig): AlertConfig {
    const off: AlertConfig = {
        highValue: { enabled: false, threshold: 100_000 },
        supplierConcentration: { enabled: false, threshold: 0.25 },
        volumeSpike: { enabled: false, threshold: 0.5 },
        zeroTax: { enabled: false },
        duplicate: { enabled: false },
        numberingGap: { enabled: false },
    };
    return { ...off, [rule]: { ...DEFAULT_ALERT_CONFIG[rule], enabled: true } };
}

describe('mergeAlertConfig', () => {
    it('returns defaults when nothing is passed', () => {
        expect(mergeAlertConfig(null)).toEqual(DEFAULT_ALERT_CONFIG);
    });
    it('overrides only the given keys, keeping the rest', () => {
        const merged = mergeAlertConfig({ highValue: { enabled: false, threshold: 999 } });
        expect(merged.highValue).toEqual({ enabled: false, threshold: 999 });
        expect(merged.supplierConcentration).toEqual(DEFAULT_ALERT_CONFIG.supplierConcentration);
    });
});

describe('evaluateAlerts — high_value', () => {
    it('emits a warning per NF above the threshold with the value in refs/data', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ chave: 'K1', valorTotal: 250_000, cnpjEmitente: '111', razaoSocial: 'ACME' }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('highValue'));
        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toMatchObject({
            type: 'high_value',
            severity: 'warning',
            fingerprint: 'high_value:K1',
            refs: { chaves: ['K1'], cnpjEmitente: '111' },
        });
        expect(alerts[0]!.data.valorTotal).toBe(250_000);
        // the threshold is passed to the query
        expect(runs[0]!.params.threshold).toBe(100_000);
    });
});

describe('evaluateAlerts — supplier_concentration', () => {
    it('emits a warning when an issuer share crosses the threshold', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ cnpjEmitente: '222', razaoSocial: 'BigCo', share: 0.4 }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('supplierConcentration'));
        expect(alerts[0]).toMatchObject({
            type: 'supplier_concentration',
            fingerprint: 'supplier_concentration:222',
        });
        expect(alerts[0]!.message).toContain('40%');
    });
});

describe('evaluateAlerts — volume_spike', () => {
    it('flags a spike when recent half deviates beyond the threshold', async () => {
        // series [10,10,50,50] → earlier=20, recent=100 → +400%
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ mes: '2026-01', total: 10 }),
            fakeRecord({ mes: '2026-02', total: 10 }),
            fakeRecord({ mes: '2026-03', total: 50 }),
            fakeRecord({ mes: '2026-04', total: 50 }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('volumeSpike'));
        expect(alerts).toHaveLength(1);
        expect(alerts[0]!.type).toBe('volume_spike');
        expect(alerts[0]!.data.change).toBeCloseTo(4, 5);
        // fingerprint is stable across re-evaluations (no month-count in it)
        expect(alerts[0]!.fingerprint).toBe('volume_spike:up');
    });

    it('stays silent when the deviation is under the threshold', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ mes: '2026-01', total: 100 }),
            fakeRecord({ mes: '2026-02', total: 100 }),
            fakeRecord({ mes: '2026-03', total: 105 }),
            fakeRecord({ mes: '2026-04', total: 105 }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('volumeSpike'));
        expect(alerts).toHaveLength(0);
    });

    it('stays silent with fewer than 4 months of data', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ mes: '2026-01', total: 10 }),
            fakeRecord({ mes: '2026-02', total: 90 }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('volumeSpike'));
        expect(alerts).toHaveLength(0);
    });
});

describe('evaluateAlerts — zero_tax', () => {
    it('emits an info alert for active NF with value but no ICMS/IBS', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ chave: 'Z1', valorTotal: 3000, cnpjEmitente: '333', razaoSocial: 'NoTax' }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('zeroTax'));
        expect(alerts[0]).toMatchObject({ type: 'zero_tax', severity: 'info', fingerprint: 'zero_tax:Z1' });
        // guards: active, not devolução, zero ICMS and IBS
        expect(runs[0]!.cypher).toContain("nf.status = 'ativa'");
        expect(runs[0]!.cypher).toContain('total_vICMS');
        expect(runs[0]!.cypher).toContain('total_vIBS');
    });
});

describe('evaluateAlerts — duplicate & numbering_gap (reuse analysis.queries)', () => {
    it('maps duplicate groups to critical alerts', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ cnpjEmitente: '444', razaoSocial: 'Dup', dataEmissao: '2026-06-01', valorTotal: 500, count: 3, chaves: ['a', 'b', 'c'] }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('duplicate'));
        expect(alerts[0]).toMatchObject({
            type: 'duplicate',
            severity: 'critical',
            // fingerprint = sorted access keys (stable, no float)
            fingerprint: 'duplicate:a,b,c',
            refs: { chaves: ['a', 'b', 'c'], cnpjEmitente: '444' },
        });
    });

    it('maps numbering gaps to warning alerts', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ cnpjEmitente: '555', razaoSocial: 'Gap', serie: '1', from: 100, to: 103, missing: 2 }),
        ]);
        const alerts = await evaluateAlerts(driver, onlyRule('numberingGap'));
        expect(alerts[0]).toMatchObject({
            type: 'numbering_gap',
            severity: 'warning',
            fingerprint: 'numbering_gap:555:1:100:103',
        });
    });
});

describe('evaluateAlerts — disabled rules run no queries', () => {
    it('emits nothing and issues no query when every rule is off', async () => {
        const off: AlertConfig = {
            highValue: { enabled: false, threshold: 100_000 },
            supplierConcentration: { enabled: false, threshold: 0.25 },
            volumeSpike: { enabled: false, threshold: 0.5 },
            zeroTax: { enabled: false },
            duplicate: { enabled: false },
            numberingGap: { enabled: false },
        };
        const { driver, runs } = makeFakeDriver(() => []);
        const alerts = await evaluateAlerts(driver, off);
        expect(alerts).toHaveLength(0);
        expect(runs).toHaveLength(0);
    });
});
