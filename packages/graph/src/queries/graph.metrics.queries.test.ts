import { describe, it, expect } from 'vitest';
import { makeFakeDriver, fakeRecord } from '../__test-helpers__/fake-driver.js';
import { getCentrality, getCommunities, connectedComponents } from './graph.metrics.queries.js';

describe('connectedComponents (unit, pure)', () => {
    it('groups companies reachable from one another (union-find)', () => {
        // A-B, B-C form one community; D-E another; F is isolated (no edge).
        const comps = connectedComponents([
            { a: 'A', b: 'B' },
            { a: 'B', b: 'C' },
            { a: 'D', b: 'E' },
        ]);
        expect(comps).toHaveLength(2);
        // largest first
        expect(comps[0]!.members).toEqual(['A', 'B', 'C']);
        expect(comps[0]!.size).toBe(3);
        expect(comps[0]!.id).toBe('A'); // smallest cnpj is the stable id
        expect(comps[1]!.members).toEqual(['D', 'E']);
    });

    it('merges chains into a single component regardless of edge order', () => {
        const comps = connectedComponents([
            { a: 'C', b: 'D' },
            { a: 'A', b: 'B' },
            { a: 'B', b: 'C' }, // bridges the two pairs
        ]);
        expect(comps).toHaveLength(1);
        expect(comps[0]!.members).toEqual(['A', 'B', 'C', 'D']);
    });

    it('ignores singletons (component of size 1 is not a community)', () => {
        // No edges → no company reaches another → no communities.
        expect(connectedComponents([])).toEqual([]);
    });

    it('deduplicates repeated edges without inflating the component', () => {
        const comps = connectedComponents([
            { a: 'A', b: 'B' },
            { a: 'A', b: 'B' },
            { a: 'B', b: 'A' },
        ]);
        expect(comps).toHaveLength(1);
        expect(comps[0]!.members).toEqual(['A', 'B']);
    });
});

describe('getCentrality (unit, driver fake)', () => {
    it('maps degree/totalNFs/valorTotal and passes the limit', async () => {
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ cnpj: '111', razaoSocial: 'Hub SA', uf: 'SP', degree: 12, totalNFs: 40, valorTotal: 90000 }),
        ]);
        const out = await getCentrality(driver, 25);
        expect(out[0]).toEqual({
            cnpj: '111', razaoSocial: 'Hub SA', uf: 'SP', degree: 12, totalNFs: 40, valorTotal: 90000,
        });
        // degree centrality: distinct partners, both directions, ignoring self-loops
        expect(runs[0]!.cypher).toContain('count(DISTINCT partner) AS degree');
        expect(runs[0]!.cypher).toContain('issuer.cnpj <> recipient.cnpj');
        // both directions unioned so a receive-only company is still counted
        expect(runs[0]!.cypher).toContain('UNWIND [{company: issuer, partner: recipient}');
        expect((runs[0]!.params.limit as { toNumber(): number }).toNumber()).toBe(25);
        // devoluções não contam como relação comercial na centralidade (NOTA-201)
        expect(runs[0]!.cypher).toContain("coalesce(nf.finalidade, '') <> 'devolucao'");
    });
});

describe('getCommunities (unit, driver fake)', () => {
    it('reads normalized undirected edges and builds communities', async () => {
        // The query returns already-normalized (a<b) distinct pairs.
        const { driver, runs } = makeFakeDriver(() => [
            fakeRecord({ a: '111', b: '222' }),
            fakeRecord({ a: '222', b: '333' }),
        ]);
        const out = await getCommunities(driver, 500);
        expect(out).toHaveLength(1);
        expect(out[0]!.members).toEqual(['111', '222', '333']);
        // pair normalization (lo/hi) so direction does not double edges
        expect(runs[0]!.cypher).toContain('WHEN ca < cb THEN ca ELSE cb END AS lo');
        // devoluções não contam como aresta na detecção de comunidades (NOTA-201)
        expect(runs[0]!.cypher).toContain("coalesce(nf.finalidade, '') <> 'devolucao'");
        expect((runs[0]!.params.limit as { toNumber(): number }).toNumber()).toBe(500);
    });

    it('returns empty when the network has no inter-company edges', async () => {
        const { driver } = makeFakeDriver(() => []);
        expect(await getCommunities(driver)).toEqual([]);
    });
});
