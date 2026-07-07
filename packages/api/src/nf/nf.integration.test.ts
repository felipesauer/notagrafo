import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import neo4j, { type Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import { runMigrations } from '@notagrafo/graph';
import { createNFQueue, processNFe, LocalXmlStorage } from '@notagrafo/worker';
import { Worker, type Queue } from 'bullmq';
import type { ProcessNFeJobData } from '@notagrafo/worker';
import { buildApp, API_PREFIX } from '../app.js';
import { createUser } from '../auth/user.repository.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const CHAVE = '35200114200166000187550010000000071234567890';

let neo4jC: StartedNeo4jContainer;
let redisC: StartedRedisContainer;
let driver: Driver;
let connection: Redis;
let queue: Queue<ProcessNFeJobData>;
let storage: LocalXmlStorage;
let app: FastifyInstance;
let token: string;
const tmp = mkdtempSync(join(tmpdir(), 'nfp-nfroutes-'));

const xml = (name = 'nfe-valida-v4.00.xml'): string => readFileSync(join(FIXTURES, name), 'utf8');

beforeAll(async () => {
    [neo4jC, redisC] = await Promise.all([
        new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start(),
        new RedisContainer('redis:7-alpine').start(),
    ]);
    driver = neo4j.driver(neo4jC.getBoltUri(), neo4j.auth.basic(neo4jC.getUsername(), neo4jC.getPassword()));
    connection = new Redis(redisC.getConnectionUrl(), { maxRetriesPerRequest: null });
    queue = createNFQueue(connection);
    storage = new LocalXmlStorage(tmp);
    process.env.AUTH_SECRET = 'test-secret';
    await runMigrations(driver);
    await createUser(driver, { email: 'u@e.com', nome: 'U', senha: 'p' });
    app = await buildApp({ rateLimit: false, driver, queue, storage });
    await app.ready();
    const login = await app.inject({ method: 'POST', url: `${API_PREFIX}/auth/login`, payload: { email: 'u@e.com', password: 'p' } });
    token = login.json().token;
}, 180_000);

afterAll(async () => {
    await app?.close();
    await queue?.obliterate({ force: true }).catch(() => {});
    await connection?.quit();
    await driver?.close();
    await Promise.all([neo4jC?.stop(), redisC?.stop()]);
    rmSync(tmp, { recursive: true, force: true });
});

beforeEach(async () => {
    const s = driver.session();
    try {
        await s.run('MATCH (n) WHERE NOT n:Usuario DETACH DELETE n');
    } finally {
        await s.close();
    }
    await queue.obliterate({ force: true }).catch(() => {});
});

const bearer = (): Record<string, string> => ({ authorization: `Bearer ${token}` });

function uploadPayload(content: string, filename = 'nota.xml') {
    const boundary = '----vitest';
    const body =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: application/xml\r\n\r\n${content}\r\n--${boundary}--\r\n`;
    return { body, headers: { ...bearer(), 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

describe('rotas de NF', () => {
    it('rota protegida sem token → 401', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf` });
        expect(res.statusCode).toBe(401);
    });

    it('POST /nf/upload aceita um XML válido → 202', async () => {
        const { body, headers } = uploadPayload(xml());
        const res = await app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(202);
        expect(res.json()).toMatchObject({ status: 'queued', arquivos: 1 });
        expect(res.json().jobId).toBeTruthy();
    });

    it('upload de XML inválido → 422 INVALID_XML', async () => {
        const { body, headers } = uploadPayload(xml('nfe-invalida-schema.xml'));
        const res = await app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(422);
        expect(res.json().error).toBe('INVALID_XML');
    });

    it('upload de versão não suportada (3.10) → 422 UNSUPPORTED_SCHEMA_VERSION', async () => {
        const { body, headers } = uploadPayload(xml('nfe-versao-desconhecida.xml'));
        const res = await app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(422);
        expect(res.json().error).toBe('UNSUPPORTED_SCHEMA_VERSION');
    });

    it('upload duplicado (já no grafo) → 409 DUPLICATE_NF', async () => {
        // grava a NF diretamente no grafo
        await processNFe({ xml: xml() }, { driver, storage });
        const { body, headers } = uploadPayload(xml());
        const res = await app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('DUPLICATE_NF');
    });

    it('GET /nf lista com paginação (data + pagination + meta)', async () => {
        await processNFe({ xml: xml() }, { driver, storage });
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf?limit=10&status=ativa`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        const json = res.json();
        expect(Array.isArray(json.data)).toBe(true);
        expect(json.data.length).toBe(1);
        expect(json.pagination).toHaveProperty('hasMore');
        // meta: total respeita os filtros, filtrosAtivos lista as chaves usadas
        expect(json.meta.total).toBe(1);
        expect(json.meta.filtrosAtivos).toEqual(['status']);
    });

    it('GET /nf coage valorTotalMin/Max da query (string→number) e filtra', async () => {
        await processNFe({ xml: xml() }, { driver, storage }); // valorTotal = 10
        // valores passam como STRING na query; o ajv do Fastify deve coagir para number.
        const dentro = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf?valorTotalMin=5&valorTotalMax=50`, headers: bearer() });
        expect(dentro.statusCode).toBe(200);
        expect(dentro.json().data.length).toBe(1);
        expect(dentro.json().meta.filtrosAtivos.sort()).toEqual(['valorTotalMax', 'valorTotalMin']);

        const fora = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf?valorTotalMin=1000`, headers: bearer() });
        expect(fora.json().data.length).toBe(0);
        expect(fora.json().meta.total).toBe(0);
    });

    it('GET /nf/:chave detalha e cria evento consultada (assíncrono)', async () => {
        await processNFe({ xml: xml() }, { driver, storage });
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/${CHAVE}`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(res.json().chaveAcesso).toBe(CHAVE);

        // o evento consultada é assíncrono — aguarda um tick e verifica
        await new Promise((r) => setTimeout(r, 300));
        const eventos = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/${CHAVE}/events`, headers: bearer() });
        const body = eventos.json();
        // chaveAcesso no topo (contrato §4)
        expect(body.chaveAcesso).toBe(CHAVE);
        const tipos = body.eventos.map((e: { tipo: string }) => e.tipo);
        expect(tipos).toContain('consultada');
        const consultada = body.eventos.find((e: { tipo: string }) => e.tipo === 'consultada');
        // timestamp ISO8601 (round-trip por Date) e sem campo 'detalhes'
        expect(new Date(consultada.timestamp).toISOString()).toBe(consultada.timestamp);
        expect(consultada).not.toHaveProperty('detalhes');
        expect(consultada.autor).toBeTruthy();
    });

    it('GET /nf/:chave reformata o detalhe no contrato (tributos, totais, cfop)', async () => {
        const CHAVE_TRIB = '35200114200166000187550010000000081234567891';
        await processNFe({ xml: xml('nfe-tributada-v4.00.xml') }, { driver, storage });
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/${CHAVE_TRIB}`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        const j = res.json();
        // cfop com descrição do catálogo
        expect(j.cfop).toMatchObject({ codigo: '6102', descricao: expect.any(String) });
        // totais sem prefixo total_
        expect(j.totais).toMatchObject({ vNF: 1373.5, vICMS: 180, vIPI: 50 });
        expect(j).not.toHaveProperty('total_vNF');
        // item com tributos agrupados e ncm aninhado no produto
        const item = j.itens[0];
        expect(item.tributos).toMatchObject({ vICMS: 180, vICMSST: 72, vFCP: 20, vIPI: 50, vPIS: 16.5, vCOFINS: 76 });
        expect(item).not.toHaveProperty('vICMS');
        expect(item.produto.ncm).toMatchObject({ codigo: '84713012', descricao: expect.stringContaining('Máquinas') });
    });

    it('GET /nf/:chave inexistente → 404 NF_NOT_FOUND', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/00000000000000000000000000000000000000000000`, headers: bearer() });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('NF_NOT_FOUND');
    });

    it('GET /nf/:chave/events de NF inexistente → 404 NF_NOT_FOUND', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/00000000000000000000000000000000000000000000/events`, headers: bearer() });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('NF_NOT_FOUND');
    });

    it('GET /nf/:chave/xml retorna o XML do storage', async () => {
        await processNFe({ xml: xml() }, { driver, storage });
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/${CHAVE}/xml`, headers: bearer() });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/xml');
        expect(res.body).toContain('<NFe');
    });

    it('GET /nf/jobs/:jobId inexistente → 404 JOB_NOT_FOUND', async () => {
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/jobs/inexistente`, headers: bearer() });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('JOB_NOT_FOUND');
    });

    it('GET /nf/jobs/:jobId em andamento traz total e iniciadoEm; concluído traz concluidoEm e resultado', async () => {
        const { body, headers } = uploadPayload(xml());
        const up = await app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        const jobId = up.json().jobId as string;
        expect(jobId).toBeTruthy();

        // Antes de processar: estado waiting/active do BullMQ → 'processing' (contrato §3).
        const pending = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/jobs/${jobId}`, headers: bearer() });
        expect(pending.statusCode).toBe(200);
        expect(pending.json().status).toBe('processing');
        expect(pending.json().total).toBe(1);
        expect(pending.json().jobId).toBe(jobId);

        // Processa o job com um worker real ligado à mesma fila (com progresso).
        const progressos: number[] = [];
        const worker = new Worker(
            queue.name,
            async (job) =>
                processNFe(job.data as { xml: string }, {
                    driver,
                    storage,
                    onProgress: async (pct) => {
                        progressos.push(pct);
                        await job.updateProgress(pct);
                    },
                }),
            { connection: connection.duplicate() },
        );
        try {
            await new Promise<void>((resolve, reject) => {
                worker.on('completed', () => resolve());
                worker.on('failed', (_job, err) => reject(err));
            });
        } finally {
            await worker.close();
        }

        const done = await app.inject({ method: 'GET', url: `${API_PREFIX}/nf/jobs/${jobId}`, headers: bearer() });
        expect(done.statusCode).toBe(200);
        const json = done.json();
        expect(json.status).toBe('completed');
        expect(json.total).toBe(1);
        expect(json.iniciadoEm).toBeTruthy();
        expect(json.concluidoEm).toBeTruthy();
        expect(json.resultado).toEqual({ processadas: 1, duplicatas: 0, erros: 0 });
        // progresso foi reportado nos marcos e chegou a 100 (NOTA-42)
        expect(progressos).toEqual([25, 50, 75, 100]);
        expect(json.progresso).toBe(100);
    });
});
