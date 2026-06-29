import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import neo4j, { type Driver } from 'neo4j-driver';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { runMigrations, getInvoice } from '@notagrafo/graph';
import { processNFe, type ProcessNFeJobData } from './process-nfe.job.js';
import { LocalXmlStorage } from '../storage/local.storage.js';
import { NF_QUEUE } from '../queue/config.js';
import { createNFQueue, enqueueNFe, NotaFiscalDuplicadaError } from '../queue/nf.queue.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const CHAVE = '35200114200166000187550010000000071234567890';

let neo4jC: StartedNeo4jContainer;
let redisC: StartedRedisContainer;
let driver: Driver;
let connection: Redis;
const tmp = mkdtempSync(join(tmpdir(), 'nfp-job-'));
let storage: LocalXmlStorage;

beforeAll(async () => {
    [neo4jC, redisC] = await Promise.all([
        new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start(),
        new RedisContainer('redis:7-alpine').start(),
    ]);
    driver = neo4j.driver(neo4jC.getBoltUri(), neo4j.auth.basic(neo4jC.getUsername(), neo4jC.getPassword()));
    connection = new Redis(redisC.getConnectionUrl(), { maxRetriesPerRequest: null });
    storage = new LocalXmlStorage(tmp);
    await runMigrations(driver);
}, 180_000);

afterAll(async () => {
    await connection?.quit();
    await driver?.close();
    await Promise.all([neo4jC?.stop(), redisC?.stop()]);
    rmSync(tmp, { recursive: true, force: true });
});

beforeEach(async () => {
    const s = driver.session();
    try {
        await s.run('MATCH (n) DETACH DELETE n');
    } finally {
        await s.close();
    }
});

const xml = (): string => readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');

describe('processNFe (pipeline ponta a ponta)', () => {
    it('valida, parseia, grava no grafo e salva o XML', async () => {
        const res = await processNFe({ xml: xml() }, { driver, storage });

        expect(res.chaveAcesso).toBe(CHAVE);
        expect(res.versao).toBe('4.00');
        expect(res.storageRef).toContain(`${CHAVE}.xml`);

        // grafo populado
        const nf = await getInvoice(driver, CHAVE);
        expect(nf).not.toBeNull();
        // XML salvo e recuperável
        expect((await storage.get(CHAVE)).toString('utf8')).toContain('<NFe');
    });

    it('rejeita XML inválido (sem entrar no grafo)', async () => {
        const invalido = readFileSync(join(FIXTURES, 'nfe-invalida-schema.xml'), 'utf8');
        await expect(processNFe({ xml: invalido }, { driver, storage })).rejects.toThrow(/inválido/);
        expect(await getInvoice(driver, CHAVE)).toBeNull();
    });
});

describe('enqueueNFe (bloqueio de duplicata)', () => {
    it('enfileira a primeira vez e bloqueia a segunda (já no grafo)', async () => {
        const queue = createNFQueue(connection);
        try {
            const r1 = await enqueueNFe(queue, driver, xml());
            expect(r1.chaveAcesso).toBe(CHAVE);

            // grava no grafo (simula o job concluído)
            await processNFe({ xml: xml() }, { driver, storage });

            // segunda tentativa: duplicata
            await expect(enqueueNFe(queue, driver, xml())).rejects.toThrow(NotaFiscalDuplicadaError);
        } finally {
            await queue.obliterate({ force: true });
            await queue.close();
        }
    });
});

describe('Worker BullMQ (fluxo real com retry/DLQ)', () => {
    it('processa um job da fila e o conclui', async () => {
        const queue = new Queue<ProcessNFeJobData>(NF_QUEUE, { connection });
        const worker = new Worker<ProcessNFeJobData>(
            NF_QUEUE,
            async (job) => processNFe(job.data, { driver, storage }),
            { connection, concurrency: 2 },
        );
        try {
            const completed = new Promise<void>((resolve, reject) => {
                worker.on('completed', () => resolve());
                worker.on('failed', (_j, err) => reject(err));
            });
            await queue.add('process-nfe', { xml: xml() }, { jobId: CHAVE, attempts: 3 });
            await completed;

            expect(await getInvoice(driver, CHAVE)).not.toBeNull();
        } finally {
            await worker.close();
            await queue.obliterate({ force: true });
            await queue.close();
        }
    }, 30_000);
});
