import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import neo4j, { type Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import { runMigrations } from '@notagrafo/graph';
import { createNFQueue, LocalXmlStorage } from '@notagrafo/worker';
import type { Queue } from 'bullmq';
import type { ProcessNFeJobData } from '@notagrafo/worker';
import { buildApp, API_PREFIX } from '../app.js';
import { createUser } from '../auth/user.repository.js';

/** Contexto compartilhado por testes de integração da API. */
export interface ApiTestContext {
    app: FastifyInstance;
    driver: Driver;
    redis: Redis;
    queue: Queue<ProcessNFeJobData>;
    storage: LocalXmlStorage;
    token: string;
    /** Headers com o Bearer do usuário de teste. */
    bearer(): Record<string, string>;
    /** Limpa o grafo (preservando usuários) — chamar em afterEach. */
    clearDatabase(): Promise<void>;
    /** Encerra app, conexões e containers — chamar em afterAll. */
    teardown(): Promise<void>;
}

const TEST_USER = { email: 'tester@notagrafo.local', nome: 'Tester', senha: 'senha123' };

/**
 * Sobe Neo4j + Redis reais (Testcontainers), injeta as URIs, roda as migrations
 * e monta a API completa (auth + nf + empresa + stats + export + health).
 * Retorna um contexto com helpers de limpeza e teardown.
 */
export async function setupApiIntegration(): Promise<ApiTestContext> {
    const [neo4jC, redisC]: [StartedNeo4jContainer, StartedRedisContainer] = await Promise.all([
        new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start(),
        new RedisContainer('redis:7-alpine').start(),
    ]);

    // Injeta as URIs no ambiente (como o setup do 04 infra-testes.md).
    process.env.NEO4J_URI = neo4jC.getBoltUri();
    process.env.NEO4J_USER = neo4jC.getUsername();
    process.env.NEO4J_PASSWORD = neo4jC.getPassword();
    process.env.REDIS_URL = redisC.getConnectionUrl();
    process.env.AUTH_SECRET = 'integration-secret';

    const driver = neo4j.driver(neo4jC.getBoltUri(), neo4j.auth.basic(neo4jC.getUsername(), neo4jC.getPassword()));
    const redis = new Redis(redisC.getConnectionUrl(), { maxRetriesPerRequest: null });
    const tmp = mkdtempSync(join(tmpdir(), 'nfp-apiint-'));
    const storage = new LocalXmlStorage(tmp);
    const queue = createNFQueue(redis);

    await runMigrations(driver);
    await createUser(driver, TEST_USER);

    const app = await buildApp({ rateLimit: false, driver, queue, storage, redis });
    await app.ready();

    const login = await app.inject({
        method: 'POST',
        url: `${API_PREFIX}/auth/login`,
        payload: { email: TEST_USER.email, password: TEST_USER.senha },
    });
    const token = login.json().token as string;

    const clearDatabase = async (): Promise<void> => {
        const session = driver.session();
        try {
            await session.run('MATCH (n) WHERE NOT n:Usuario DETACH DELETE n');
        } finally {
            await session.close();
        }
        await queue.obliterate({ force: true }).catch(() => {});
    };

    const teardown = async (): Promise<void> => {
        await app.close();
        await redis.quit();
        await driver.close();
        await Promise.all([neo4jC.stop(), redisC.stop()]);
        rmSync(tmp, { recursive: true, force: true });
    };

    return {
        app,
        driver,
        redis,
        queue,
        storage,
        token,
        bearer: () => ({ authorization: `Bearer ${token}` }),
        clearDatabase,
        teardown,
    };
}
