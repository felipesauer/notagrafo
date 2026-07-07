import neo4j, { type Driver } from 'neo4j-driver';

/**
 * Graph metrics (fiscal BI — EPIC-28): degree centrality and community detection
 * over the company↔company network derived from
 * (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa).
 * Pure Cypher / in-app (no GDS — ADR-20). Analysis scope: describes the network,
 * does not alter it. Code names in English; fiscal terms (cnpj, NF) stay in PT.
 */

const neo4jInt = (n: number) => neo4j.int(Math.trunc(n));

const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'toNumber' in v) return (v as { toNumber(): number }).toNumber();
    return Number(v ?? 0);
};

/** A company ranked by how central (connected) it is in the trade network. */
export interface CentralityNode {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    /** Distinct trade partners (issuer + recipient side, deduplicated). */
    degree: number;
    /** NF-e issued to / received from those partners. */
    totalNFs: number;
    /** Total value transacted with partners. */
    valorTotal: number;
}

/**
 * Degree centrality per company: number of DISTINCT trade partners (counting both
 * directions, deduplicated), plus transacted NF count and value. A company that
 * trades with many others is a network "hub". Returns the top `limit` by degree.
 * Ignores self-loops (issuer = recipient) and stub NFs (status IS NULL).
 */
export async function getCentrality(driver: Driver, limit = 50): Promise<CentralityNode[]> {
    const session = driver.session();
    try {
        // Emit one row per (company, partner, nf) covering BOTH directions:
        // company as issuer (a→b) and company as recipient (b→a). Starting from
        // the NF and projecting each endpoint as company/partner ensures a
        // receive-only company (never an issuer) is still counted. Grouping by
        // (company, partner) first, then counting DISTINCT partner, avoids any
        // double counting of a partner traded with in both directions.
        const res = await session.run(
            `MATCH (issuer:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(recipient:Empresa)
             WHERE nf.status IS NOT NULL AND issuer.cnpj <> recipient.cnpj
             // Two directed views of the same edge, unioned.
             UNWIND [{company: issuer, partner: recipient}, {company: recipient, partner: issuer}] AS pair
             WITH pair.company AS company, pair.partner AS partner, nf
             WITH company, partner, count(nf) AS nfs, sum(coalesce(nf.valorTotal, 0)) AS valor
             WITH company, count(DISTINCT partner) AS degree,
                  sum(nfs) AS totalNFs, sum(valor) AS valorTotal
             RETURN company.cnpj AS cnpj, company.razaoSocial AS razaoSocial, company.uf AS uf,
                    degree, totalNFs, valorTotal
             ORDER BY degree DESC, valorTotal DESC
             LIMIT $limit`,
            { limit: neo4jInt(limit) },
        );
        return res.records.map((r) => ({
            cnpj: String(r.get('cnpj') ?? ''),
            razaoSocial: String(r.get('razaoSocial') ?? ''),
            uf: String(r.get('uf') ?? ''),
            degree: toNum(r.get('degree')),
            totalNFs: toNum(r.get('totalNFs')),
            valorTotal: toNum(r.get('valorTotal')),
        }));
    } finally {
        await session.close();
    }
}

/** A trade-network edge (undirected, for community detection). */
interface Edge {
    a: string;
    b: string;
}

/** A detected community (a cluster of companies that transact among themselves). */
export interface Community {
    /** Stable id: the smallest cnpj in the component. */
    id: string;
    members: string[];
    size: number;
}

/**
 * Reads the undirected company↔company edges (issuer/recipient pairs) with a value
 * threshold to keep the graph meaningful. Each pair appears once (a < b).
 */
async function getUndirectedEdges(driver: Driver, limit: number): Promise<Edge[]> {
    const session = driver.session();
    try {
        const res = await session.run(
            `MATCH (a:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(b:Empresa)
             WHERE nf.status IS NOT NULL AND a.cnpj <> b.cnpj
             WITH a.cnpj AS ca, b.cnpj AS cb
             // Normalize each pair so direction does not create two edges.
             WITH CASE WHEN ca < cb THEN ca ELSE cb END AS lo,
                  CASE WHEN ca < cb THEN cb ELSE ca END AS hi
             WITH DISTINCT lo, hi
             RETURN lo AS a, hi AS b
             LIMIT $limit`,
            { limit: neo4jInt(limit) },
        );
        return res.records.map((r) => ({ a: String(r.get('a') ?? ''), b: String(r.get('b') ?? '') }));
    } finally {
        await session.close();
    }
}

/**
 * Weakly-connected components via union-find over the undirected edge list.
 * Each component is a "community" of companies reachable from one another. This
 * is the GDS-free approximation from ADR-20 (no Louvain/modularity). Returns
 * communities with 2+ members, largest first.
 */
export function connectedComponents(edges: Edge[]): Community[] {
    const parent = new Map<string, string>();
    const find = (x: string): string => {
        let root = x;
        while (parent.get(root) !== root) root = parent.get(root)!;
        // Path compression.
        let cur = x;
        while (parent.get(cur) !== root) {
            const next = parent.get(cur)!;
            parent.set(cur, root);
            cur = next;
        }
        return root;
    };
    const add = (x: string) => {
        if (!parent.has(x)) parent.set(x, x);
    };
    const union = (x: string, y: string) => {
        add(x);
        add(y);
        const rx = find(x);
        const ry = find(y);
        if (rx !== ry) parent.set(rx, ry);
    };

    for (const e of edges) union(e.a, e.b);

    const groups = new Map<string, string[]>();
    for (const node of parent.keys()) {
        const root = find(node);
        const list = groups.get(root) ?? [];
        list.push(node);
        groups.set(root, list);
    }

    return [...groups.values()]
        .filter((members) => members.length >= 2)
        .map((members) => {
            const sorted = [...members].sort();
            return { id: sorted[0]!, members: sorted, size: sorted.length };
        })
        .sort((x, y) => y.size - x.size);
}

/**
 * Detects communities in the trade network: reads the undirected edges (up to
 * `edgeLimit`) and groups companies into connected components. Returns clusters
 * of 2+ companies, largest first.
 */
export async function getCommunities(driver: Driver, edgeLimit = 2000): Promise<Community[]> {
    const edges = await getUndirectedEdges(driver, edgeLimit);
    return connectedComponents(edges);
}
