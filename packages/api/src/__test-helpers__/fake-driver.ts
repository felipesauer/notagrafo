import type { Driver } from 'neo4j-driver';

/** Record sintético do driver Neo4j: get(key) → valor do mapa. */
export function rec(map: Record<string, unknown>) {
    return { get: (k: string) => map[k] };
}

/**
 * Driver Neo4j fake e inspecionável (sem rede). `responder(cypher, params, i)`
 * devolve os records de cada chamada na sessão (i = índice na sessão).
 */
export function makeFakeDriver(responder: (cypher: string, params: Record<string, unknown>, callIndex: number) => unknown[]) {
    const runs: { cypher: string; params: Record<string, unknown> }[] = [];
    const session = () => {
        let i = 0;
        const run = async (cypher: string, params: Record<string, unknown> = {}) => {
            runs.push({ cypher, params });
            return { records: responder(cypher, params, i++) };
        };
        return {
            run,
            executeWrite: async <T>(w: (tx: { run: typeof run }) => Promise<T>) => w({ run }),
            executeRead: async <T>(w: (tx: { run: typeof run }) => Promise<T>) => w({ run }),
            close: async () => {},
        };
    };
    return { driver: { session } as unknown as Driver, runs };
}
