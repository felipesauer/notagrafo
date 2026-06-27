import neo4j, { type Driver } from 'neo4j-driver';

/** Configuração de conexão do Neo4j, lida das variáveis NEO4J_*. */
export interface Neo4jConfig {
    uri: string;
    user: string;
    password: string;
}

/** Lê a configuração do ambiente (NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD). */
export function configFromEnv(env: NodeJS.ProcessEnv = process.env): Neo4jConfig {
    const uri = env.NEO4J_URI;
    const user = env.NEO4J_USER;
    const password = env.NEO4J_PASSWORD;
    if (!uri || !user || !password) {
        throw new Error(
            'Conexão Neo4j incompleta: defina NEO4J_URI, NEO4J_USER e NEO4J_PASSWORD.',
        );
    }
    return { uri, user, password };
}

/** Cria um Driver Neo4j a partir da configuração (ou do ambiente, por padrão). */
export function createDriver(config: Neo4jConfig = configFromEnv()): Driver {
    return neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password));
}

let singleton: Driver | undefined;

/** Retorna o Driver compartilhado do processo, criando-o na primeira chamada. */
export function getDriver(): Driver {
    singleton ??= createDriver();
    return singleton;
}

/** Fecha e descarta o Driver compartilhado (usar no shutdown da API/worker). */
export async function closeDriver(): Promise<void> {
    if (singleton) {
        await singleton.close();
        singleton = undefined;
    }
}
