import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { makeFakeDriver, rec } from '../__test-helpers__/fake-driver.js';
import { alertRoutes } from './alert.routes.js';

let app: FastifyInstance;
afterEach(async () => app?.close());

/** A :Alert node as the driver returns it (get('a').properties). */
const alertNode = (props: Record<string, unknown>) => rec({ a: { properties: props } });

describe('POST /alerts/evaluate (unit)', () => {
    it('runs the rules with the global config and reports evaluated/stored', async () => {
        // No config node → defaults; high_value rule finds 1 NF; sync count = 1.
        const responder = (cypher: string) => {
            if (cypher.includes('AlertConfig')) return []; // no stored config
            if (cypher.includes('coalesce(nf.valorTotal, 0) >= $threshold'))
                return [rec({ chave: 'K1', valorTotal: 250_000, cnpjEmitente: '111', razaoSocial: 'ACME' })];
            if (cypher.includes('count(a) AS total')) return [rec({ total: 1 })];
            return []; // other rules find nothing
        };
        const { driver } = makeFakeDriver(responder);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'POST', url: '/alerts/evaluate' });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        expect(j.evaluated).toBeGreaterThanOrEqual(1);
        expect(j.stored).toBe(1);
    });
});

describe('GET /alerts (unit)', () => {
    it('lists alerts with decoded refs/data and passes filters', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            alertNode({
                id: 'id-1', type: 'duplicate', severity: 'critical', fingerprint: 'duplicate:x',
                message: 'dup', refs: JSON.stringify({ chaves: ['a'] }), data: JSON.stringify({ count: 2 }),
                read: false, createdAt: '2026-07-07T00:00:00.000Z',
            }),
        ]);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/alerts?read=false&severity=critical&limit=10' });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        expect(j.alerts[0]).toMatchObject({ id: 'id-1', type: 'duplicate', refs: { chaves: ['a'] }, data: { count: 2 } });
        expect(runs[0]!.params).toMatchObject({ read: false, severity: 'critical' });
        expect((runs[0]!.params.limit as { toNumber(): number }).toNumber()).toBe(10);
    });
});

describe('GET /alerts/count (unit)', () => {
    it('returns the unread count', async () => {
        const { driver } = makeFakeDriver(() => [rec({ total: 4 })]);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/alerts/count' });
        expect(res.statusCode).toBe(200);
        expect(res.json().unread).toBe(4);
    });
});

describe('PATCH /alerts/:id (unit)', () => {
    it('marks an existing alert as read', async () => {
        const { driver, runs } = makeFakeDriver(() => [rec({ id: 'id-1' })]);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'PATCH', url: '/alerts/id-1', payload: { read: true } });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ id: 'id-1', read: true });
        expect(runs[0]!.params).toEqual({ id: 'id-1', read: true });
    });

    it('returns 404 when the alert does not exist', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'PATCH', url: '/alerts/nope', payload: {} });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('ALERT_NOT_FOUND');
    });
});

describe('POST /alerts/read-all (unit)', () => {
    it('marks all as read and reports the count', async () => {
        const { driver } = makeFakeDriver(() => [rec({ total: 3 })]);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'POST', url: '/alerts/read-all' });
        expect(res.statusCode).toBe(200);
        expect(res.json().updated).toBe(3);
    });
});

describe('GET/PUT /alerts/config (unit)', () => {
    it('returns defaults when no config is stored', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({ method: 'GET', url: '/alerts/config' });
        expect(res.statusCode).toBe(200);
        expect(res.json().config.highValue.enabled).toBe(true);
    });

    it('saves a partial config merged over defaults', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({
            method: 'PUT',
            url: '/alerts/config',
            payload: { highValue: { enabled: false, threshold: 5000 } },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().config.highValue).toEqual({ enabled: false, threshold: 5000 });
        expect(runs[0]!.cypher).toContain("MERGE (c:AlertConfig {id: 'global'})");
    });

    it('rejects a wrong-typed threshold with 400', async () => {
        const { driver, runs } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({
            method: 'PUT',
            url: '/alerts/config',
            payload: { highValue: { threshold: 'not-a-number' } },
        });
        expect(res.statusCode).toBe(400);
        // body validation rejects before touching the driver
        expect(runs).toHaveLength(0);
    });

    it('rejects a negative threshold with 400 (minimum: 0)', async () => {
        const { driver } = makeFakeDriver(() => []);
        app = await buildTestApi((a) => alertRoutes(a, driver));
        const res = await app.inject({
            method: 'PUT',
            url: '/alerts/config',
            payload: { supplierConcentration: { threshold: -1 } },
        });
        expect(res.statusCode).toBe(400);
    });
});
