import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import neo4j, { type Driver } from 'neo4j-driver';
import { runMigrations, taxSummary } from '@notagrafo/graph';
import { processNFe } from '../jobs/process-nfe.job.js';
import { LocalXmlStorage } from '../storage/local.storage.js';
import { generateNFe, makeRng } from './generator.js';
import { runSeed } from './index.js';

let container: StartedNeo4jContainer;
let driver: Driver;
const tmp = mkdtempSync(join(tmpdir(), 'nfp-seed-'));
let storage: LocalXmlStorage;

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start();
    driver = neo4j.driver(container.getBoltUri(), neo4j.auth.basic(container.getUsername(), container.getPassword()));
    storage = new LocalXmlStorage(tmp);
    await runMigrations(driver);
}, 120_000);

afterAll(async () => {
    await driver?.close();
    await container?.stop();
    rmSync(tmp, { recursive: true, force: true });
});

async function count(label: string): Promise<number> {
    const session = driver.session();
    try {
        const res = await session.run(`MATCH (n:${label}) RETURN count(n) AS c`);
        return res.records[0]!.get('c').toNumber();
    } finally {
        await session.close();
    }
}

describe('seed de demo (pipeline real)', () => {
    it('gera N NFes válidas e popula o grafo com números coerentes', async () => {
        const N = 25;
        const rng = makeRng(123);
        let ok = 0;
        for (let i = 1; i <= N; i++) {
            const { xml } = generateNFe(i, rng);
            await processNFe({ xml, origem: 'demo-seed' }, { driver, storage });
            ok++;
        }
        expect(ok).toBe(N);

        // grafo coerente: N notas, empresas (do pool, <= 5), eventos = N
        expect(await count('NotaFiscal')).toBe(N);
        const empresas = await count('Empresa');
        expect(empresas).toBeGreaterThanOrEqual(2);
        expect(empresas).toBeLessThanOrEqual(5);
        expect(await count('Evento')).toBe(N);
        expect(await count('Produto')).toBeGreaterThanOrEqual(1);

        // stats de overview coerentes: total de NFs e valor agregado > 0
        const session = driver.session();
        try {
            const r = await session.run(
                `MATCH (nf:NotaFiscal) RETURN count(nf) AS total, sum(nf.valorTotal) AS valor`,
            );
            expect(r.records[0]!.get('total').toNumber()).toBe(N);
            expect(Number(r.records[0]!.get('valor'))).toBeGreaterThan(0);
        } finally {
            await session.close();
        }
    }, 60_000);

    it('runSeed reporta falhas (primeiroErro + errosPorTipo) sem engolir', async () => {
        // processFn que falha em NFes pares → ~metade falha.
        let i = 0;
        const processFn = async (): Promise<unknown> => {
            i++;
            if (i % 2 === 0) throw new TypeError(`boom #${i}`);
            return undefined;
        };
        const r = await runSeed({ count: 6, seed: 7 }, { driver, storage, processFn });
        expect(r.geradas).toBe(6);
        expect(r.processadas).toBe(3);
        expect(r.falhas).toBe(3);
        expect(r.primeiroErro).toMatch(/^boom #2$/);
        expect(r.errosPorTipo).toEqual({ TypeError: 3 });
    }, 60_000);

    it('runSeed com pipeline real não reporta falhas (caminho feliz)', async () => {
        const r = await runSeed({ count: 3, seed: 99 }, { driver, storage });
        expect(r.falhas).toBe(0);
        expect(r.primeiroErro).toBeNull();
        expect(r.errosPorTipo).toEqual({});
    }, 60_000);

    it('seed realista popula impostos != 0 e arestas DEVOLVE (objetivo da Fase 5)', async () => {
        // grafo limpo só para este caso (asserções absolutas).
        const limpar = driver.session();
        try {
            await limpar.run('MATCH (n) WHERE NOT n:Usuario DETACH DELETE n');
        } finally {
            await limpar.close();
        }

        const r = await runSeed({ count: 21, seed: 2026 }, { driver, storage });
        expect(r.falhas).toBe(0);

        // /stats/impostos teria valores != 0 — taxSummary soma os total_* das NFs.
        const resumo = await taxSummary(driver);
        expect(resumo.totais.vICMS).toBeGreaterThan(0);
        expect(resumo.totais.vIPI).toBeGreaterThan(0);
        expect(resumo.totais.vCOFINS).toBeGreaterThan(0);
        expect(resumo.serie.length).toBeGreaterThanOrEqual(1);

        // pelo menos uma aresta DEVOLVE foi criada (i=14 e i=21 caem na regra do runSeed).
        const session = driver.session();
        try {
            const dev = await session.run('MATCH (:NotaFiscal)-[d:DEVOLVE]->(:NotaFiscal) RETURN count(d) AS c');
            expect(dev.records[0]!.get('c').toNumber()).toBeGreaterThanOrEqual(1);
        } finally {
            await session.close();
        }
    }, 90_000);
});
