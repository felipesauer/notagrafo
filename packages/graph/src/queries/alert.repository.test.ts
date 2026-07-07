import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord, fakeNode } from '../__test-helpers__/fake-driver.js';
import {
    syncAlerts,
    listAlerts,
    countUnreadAlerts,
    markAlertRead,
    markAllAlertsRead,
    getAlertConfig,
    saveAlertConfig,
} from './alert.repository.js';
import { DEFAULT_ALERT_CONFIG, type Alert } from './alert.rules.js';

const sampleAlert: Alert = {
    type: 'high_value',
    severity: 'warning',
    fingerprint: 'high_value:K1',
    message: 'NF-e de valor elevado',
    refs: { chaves: ['K1'], cnpjEmitente: '111' },
    data: { valorTotal: 250_000 },
};

describe('syncAlerts', () => {
    it('deletes stale, upserts by fingerprint (JSON-encoded refs/data) and returns the count', async () => {
        // 3 queries per session: 0=delete, 1=upsert, 2=count
        const { driver, runs } = makeFakeDriver((cypher) =>
            cypher.includes('count(a)') ? [fakeRecord({ total: 1 })] : [],
        );
        const total = await syncAlerts(driver, [sampleAlert], '2026-07-07T00:00:00.000Z');
        expect(total).toBe(1);

        expect(runs[0]!.cypher).toContain('NOT a.fingerprint IN $fingerprints');
        expect(runs[0]!.params.fingerprints).toEqual(['high_value:K1']);

        const rows = runs[1]!.params.rows as Array<Record<string, unknown>>;
        expect(runs[1]!.cypher).toContain('MERGE (a:Alert {fingerprint: row.fingerprint})');
        expect(runs[1]!.cypher).toContain('ON CREATE SET');
        expect(rows[0]!.createdAt).toBe('2026-07-07T00:00:00.000Z');
        // refs/data are JSON strings (Neo4j has no map property type)
        expect(JSON.parse(rows[0]!.refs as string)).toEqual({ chaves: ['K1'], cnpjEmitente: '111' });
        expect(JSON.parse(rows[0]!.data as string)).toEqual({ valorTotal: 250_000 });
    });
});

describe('listAlerts', () => {
    it('parses node props back into a StoredAlert (refs/data decoded)', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({
                a: fakeNode({
                    id: 'id-1',
                    type: 'duplicate',
                    severity: 'critical',
                    fingerprint: 'duplicate:x',
                    message: 'dup',
                    refs: JSON.stringify({ chaves: ['a', 'b'] }),
                    data: JSON.stringify({ count: 2 }),
                    read: false,
                    createdAt: '2026-07-07T00:00:00.000Z',
                }),
            }),
        ]);
        const out = await listAlerts(driver, { read: false, severity: 'critical', limit: 10 });
        expect(out[0]).toEqual({
            id: 'id-1',
            type: 'duplicate',
            severity: 'critical',
            fingerprint: 'duplicate:x',
            message: 'dup',
            refs: { chaves: ['a', 'b'] },
            data: { count: 2 },
            read: false,
            createdAt: '2026-07-07T00:00:00.000Z',
        });
        // filters translate into params + severity ordering
        expect(runs[0]!.params).toMatchObject({ read: false, severity: 'critical' });
        // limit is a Neo4j integer (not a JS float — the driver rejects floats in LIMIT)
        expect((runs[0]!.params.limit as { toNumber(): number }).toNumber()).toBe(10);
        expect(runs[0]!.cypher).toContain("WHEN 'critical' THEN 0");
    });

    it('tolerates corrupt JSON in refs/data by falling back to empty', async () => {
        const { driver } = makeFakeDriver(() => [
            fakeRecord({ a: fakeNode({ id: 'x', refs: '{bad', data: 'nope', read: true }) }),
        ]);
        const out = await listAlerts(driver);
        expect(out[0]!.refs).toEqual({});
        expect(out[0]!.data).toEqual({});
        expect(out[0]!.read).toBe(true);
    });
});

describe('countUnreadAlerts', () => {
    it('returns the unread count', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ total: 7 })]);
        expect(await countUnreadAlerts(driver)).toBe(7);
        expect(runs[0]!.cypher).toContain('a.read = false');
    });
});

describe('markAlertRead', () => {
    it('returns true when the alert exists', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ id: 'id-1' })]);
        expect(await markAlertRead(driver, 'id-1')).toBe(true);
        expect(runs[0]!.params).toEqual({ id: 'id-1', read: true });
    });
    it('returns false when the alert does not exist', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await markAlertRead(driver, 'nope')).toBe(false);
    });
    it('can mark as unread', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ id: 'id-1' })]);
        await markAlertRead(driver, 'id-1', false);
        expect(runs[0]!.params.read).toBe(false);
    });
});

describe('markAllAlertsRead', () => {
    it('returns how many were affected', async () => {
        const { driver, runs } = makeFakeDriver(() => [fakeRecord({ total: 3 })]);
        expect(await markAllAlertsRead(driver)).toBe(3);
        expect(runs[0]!.cypher).toContain('SET a.read = true');
    });
});

describe('getAlertConfig / saveAlertConfig', () => {
    it('returns defaults when no config node exists', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await getAlertConfig(driver)).toEqual(DEFAULT_ALERT_CONFIG);
    });

    it('parses a stored partial config merged over defaults', async () => {
        const stored = JSON.stringify({ highValue: { enabled: false, threshold: 5000 } });
        const { driver } = makeFakeDriver(() => [fakeRecord({ json: stored })]);
        const cfg = await getAlertConfig(driver);
        expect(cfg.highValue).toEqual({ enabled: false, threshold: 5000 });
        expect(cfg.duplicate).toEqual(DEFAULT_ALERT_CONFIG.duplicate);
    });

    it('falls back to defaults on corrupt stored JSON', async () => {
        const { driver } = makeFakeDriver(() => [fakeRecord({ json: '{broken' })]);
        expect(await getAlertConfig(driver)).toEqual(DEFAULT_ALERT_CONFIG);
    });

    it('saves the merged config as JSON on the singleton node', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        const saved = await saveAlertConfig(driver, { volumeSpike: { enabled: true, threshold: 0.8 } });
        expect(saved.volumeSpike).toEqual({ enabled: true, threshold: 0.8 });
        expect(runs[0]!.cypher).toContain("MERGE (c:AlertConfig {id: 'global'})");
        expect(JSON.parse(runs[0]!.params.json as string).volumeSpike).toEqual({ enabled: true, threshold: 0.8 });
    });
});
