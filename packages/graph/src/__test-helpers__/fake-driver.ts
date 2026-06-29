import type { Driver } from 'neo4j-driver';

/** Um record sintético: get(key) → valor do mapa fornecido. */
export function fakeRecord(map: Record<string, unknown>) {
    return { get: (k: string) => map[k] };
}

/** Embrulha properties no formato de nó do driver Neo4j ({ properties }). */
export function fakeNode(properties: Record<string, unknown>) {
    return { properties };
}

export interface CapturedRun {
    cypher: string;
    params: Record<string, unknown>;
}

/**
 * Driver Neo4j fake e inspecionável, sem rede. `responder(cypher, params, i)`
 * decide os records de cada chamada (i = índice da chamada na sessão).
 * As chamadas ficam registradas em `runs` para asserção do Cypher/params.
 */
export function makeFakeDriver(responder: (cypher: string, params: Record<string, unknown>, callIndex: number) => unknown[]) {
    const runs: CapturedRun[] = [];
    let closed = 0;
    const session = () => {
        let i = 0;
        const run = async (cypher: string, params: Record<string, unknown> = {}) => {
            runs.push({ cypher, params });
            const records = responder(cypher, params, i++);
            return { records };
        };
        return {
            run,
            // Transações: passam um tx que reusa o mesmo `run` (e o mesmo contador).
            executeWrite: async <T>(work: (tx: { run: typeof run }) => Promise<T>): Promise<T> => work({ run }),
            executeRead: async <T>(work: (tx: { run: typeof run }) => Promise<T>): Promise<T> => work({ run }),
            close: async () => {
                closed++;
            },
        };
    };
    const driver = { session } as unknown as Driver;
    return { driver, runs, get sessionsClosed() { return closed; } };
}
