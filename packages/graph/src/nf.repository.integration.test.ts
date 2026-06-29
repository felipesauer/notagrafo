import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import neo4j, { type Driver } from 'neo4j-driver';
import { parseNFe, type RawDataNode } from '@notagrafo/core';
import { runMigrations } from './migrations.js';
import { mergeInvoice, type InvoiceToPersist } from './nf.repository.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core', 'src', '__fixtures__');

let container: StartedNeo4jContainer;
let driver: Driver;

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start();
    driver = neo4j.driver(
        container.getBoltUri(),
        neo4j.auth.basic(container.getUsername(), container.getPassword()),
    );
    await runMigrations(driver);
}, 120_000);

afterAll(async () => {
    await driver?.close();
    await container?.stop();
});

beforeEach(async () => {
    const session = driver.session();
    try {
        await session.run('MATCH (n) DETACH DELETE n');
    } finally {
        await session.close();
    }
});

function payloadDaFixture(arquivo: string): InvoiceToPersist {
    const xml = readFileSync(join(FIXTURES, arquivo), 'utf8');
    const parsed = parseNFe(xml, new Date('2026-06-26T12:00:00Z'));
    const raw: RawDataNode = {
        xmlGzip: gzipSync(Buffer.from(xml)),
        jsonCompleto: JSON.stringify(parsed),
        checksum: createHash('sha256').update(xml).digest('hex'),
        tamanhoBytes: Buffer.byteLength(xml),
        versaoSchema: '4.00',
    };
    return { ...parsed, raw };
}

async function count(label: string): Promise<number> {
    const session = driver.session();
    try {
        const res = await session.run(`MATCH (n:${label}) RETURN count(n) AS c`);
        return res.records[0]!.get('c').toNumber();
    } finally {
        await session.close();
    }
}

describe('mergeInvoice (Neo4j real)', () => {
    it('grava NF, empresas, produto, NCM, CFOP, RawData e Evento', async () => {
        await mergeInvoice(driver, payloadDaFixture('nfe-valida-v4.00.xml'));

        expect(await count('NotaFiscal')).toBe(1);
        expect(await count('Empresa')).toBe(2); // emitente + destinatário
        expect(await count('Produto')).toBe(1);
        expect(await count('NCM')).toBe(1);
        expect(await count('CFOP')).toBe(1);
        expect(await count('RawData')).toBe(1);
        expect(await count('Evento')).toBe(1);

        // arestas principais existem
        const session = driver.session();
        try {
            const r = await session.run(
                `MATCH (:Empresa)-[:EMITIU]->(nf:NotaFiscal)-[:DESTINADA_A]->(:Empresa),
                       (nf)-[:USA_CFOP]->(:CFOP), (nf)-[:CONTÉM]->(p:Produto)-[:CLASSIFICADO_EM]->(:NCM),
                       (nf)-[:TEM_RAW]->(:RawData), (nf)-[:TEM_EVENTO]->(:Evento)
                 RETURN nf.chaveAcesso AS chave`,
            );
            expect(r.records[0]?.get('chave')).toBe('35200114200166000187550010000000071234567890');
        } finally {
            await session.close();
        }
    });

    it('não grava propriedades null/undefined', async () => {
        await mergeInvoice(driver, payloadDaFixture('nfe-valida-v4.00.xml'));
        const session = driver.session();
        try {
            // destinatário não tem regimeTributario nem nomeFantasia — chaves não existem
            const r = await session.run(
                `MATCH (e:Empresa {cnpj: '99999999000191'}) RETURN keys(e) AS k`,
            );
            const keys = r.records[0]!.get('k') as string[];
            expect(keys).not.toContain('regimeTributario');
            expect(keys).not.toContain('nomeFantasia');
        } finally {
            await session.close();
        }
    });

    it('reprocessar a mesma chave não duplica nós (idempotente)', async () => {
        const payload = payloadDaFixture('nfe-valida-v4.00.xml');
        await mergeInvoice(driver, payload);
        await mergeInvoice(driver, payload);

        expect(await count('NotaFiscal')).toBe(1);
        expect(await count('Empresa')).toBe(2);
        expect(await count('Produto')).toBe(1);
        expect(await count('NCM')).toBe(1);
        expect(await count('CFOP')).toBe(1);
        expect(await count('RawData')).toBe(1); // MERGE da relação evita duplicar
    });
});
