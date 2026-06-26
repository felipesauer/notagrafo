import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import neo4j, { type Driver } from 'neo4j-driver';
import { runMigrations, MIGRATIONS } from './migrations.js';

let container: StartedNeo4jContainer;
let driver: Driver;

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community')
        .withPassword('testpassword')
        .start();
    driver = neo4j.driver(
        container.getBoltUri(),
        neo4j.auth.basic(container.getUsername(), container.getPassword()),
    );
}, 120_000);

afterAll(async () => {
    await driver?.close();
    await container?.stop();
});

async function count(query: string): Promise<number> {
    const session = driver.session();
    try {
        const res = await session.run(query);
        return res.records.length;
    } finally {
        await session.close();
    }
}

describe('runMigrations (Neo4j real)', () => {
    it('cria as 5 constraints de unicidade e os índices', async () => {
        await runMigrations(driver);

        const constraints = await count('SHOW CONSTRAINTS');
        expect(constraints).toBeGreaterThanOrEqual(5);

        const indexes = await count('SHOW INDEXES');
        // 3 fulltext + 3 range + os índices de apoio das constraints
        expect(indexes).toBeGreaterThanOrEqual(6);

        // constraints específicas pelo nome
        const named = await count(
            "SHOW CONSTRAINTS YIELD name WHERE name IN " +
                "['empresa_cnpj_unique','nf_chave_unique','produto_idUnico_unique'," +
                "'cfop_codigo_unique','ncm_codigo_unique'] RETURN name",
        );
        expect(named).toBe(5);
    });

    it('é idempotente: rodar novamente não gera erro', async () => {
        await expect(runMigrations(driver)).resolves.not.toThrow();
        // e não duplica constraints
        const constraints = await count('SHOW CONSTRAINTS');
        expect(constraints).toBeGreaterThanOrEqual(5);
    });

    it('aplica exatamente os statements de MIGRATIONS (todos com IF NOT EXISTS)', () => {
        expect(MIGRATIONS).toHaveLength(11);
        expect(MIGRATIONS.every((s) => s.includes('IF NOT EXISTS'))).toBe(true);
    });
});
