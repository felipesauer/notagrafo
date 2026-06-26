import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import neo4j, { type Driver } from 'neo4j-driver';
import { parseNFe, type RawDataNode } from '@notagrafo/core';
import { runMigrations } from '../migrations.js';
import { mergeNotaFiscal, type NotaFiscalParaGravar } from '../nf.repository.js';
import { getEmpresaGrafo, getEmpresaStats, DepthForaDoLimiteError } from './empresa.queries.js';
import { listNotasFiscais } from './nf.queries.js';
import { topProdutos } from './produto.queries.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');

let container: StartedNeo4jContainer;
let driver: Driver;

function payload(xml: string): NotaFiscalParaGravar {
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

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start();
    driver = neo4j.driver(container.getBoltUri(), neo4j.auth.basic(container.getUsername(), container.getPassword()));
    await runMigrations(driver);

    const base = readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8');
    // Segunda NF: chave e número diferentes (mesmo emitente) para popular o grafo.
    const segunda = base
        .replace('NFe35200114200166000187550010000000071234567890', 'NFe35200114200166000187550010000000081234567891')
        .replace('<nNF>7</nNF>', '<nNF>8</nNF>');
    await mergeNotaFiscal(driver, payload(base));
    await mergeNotaFiscal(driver, payload(segunda));
}, 120_000);

afterAll(async () => {
    await driver?.close();
    await container?.stop();
});

const EMIT = '14200166000187';

describe('empresa.queries', () => {
    it('getEmpresaStats agrega NFs emitidas e valor', async () => {
        const stats = await getEmpresaStats(driver, EMIT);
        expect(stats.totalNFsEmitidas).toBe(2);
        expect(stats.valorTotalEmitido).toBeGreaterThan(0);
    });

    it('getEmpresaGrafo retorna vizinhos com grau e respeita o limit', async () => {
        const grafo = await getEmpresaGrafo(driver, EMIT, { depth: 2, direction: 'both', limit: 50 });
        expect(grafo.cnpj).toBe(EMIT);
        expect(grafo.depth).toBe(2);
        expect(Array.isArray(grafo.nos)).toBe(true);
        expect(grafo.nos.every((n) => n.grau >= 1)).toBe(true);
    });

    it('rejeita depth fora do limite (máx 4)', async () => {
        await expect(getEmpresaGrafo(driver, EMIT, { depth: 5 })).rejects.toThrow(DepthForaDoLimiteError);
    });
});

describe('nf.queries', () => {
    it('lista com filtro por status e cnpjEmitente', async () => {
        const page = await listNotasFiscais(driver, { status: 'ativa', cnpjEmitente: EMIT });
        expect(page.data.length).toBe(2);
        expect(page.data.every((n) => n.status === 'ativa')).toBe(true);
        expect(page.data[0]!.emitente?.cnpj).toBe(EMIT);
    });

    it('pagina com cursor (limit 1 → nextCursor → próxima página)', async () => {
        const p1 = await listNotasFiscais(driver, {}, { limit: 1, orderBy: 'chaveAcesso' });
        expect(p1.data).toHaveLength(1);
        expect(p1.hasMore).toBe(true);
        expect(p1.nextCursor).toBeTruthy();

        const p2 = await listNotasFiscais(driver, {}, { limit: 1, orderBy: 'chaveAcesso', cursor: p1.nextCursor! });
        expect(p2.data).toHaveLength(1);
        expect(p2.data[0]!.chaveAcesso).not.toBe(p1.data[0]!.chaveAcesso);
        expect(p2.hasMore).toBe(false); // só 2 NFs no total
    });

    it('filtra por NCM (prefixo)', async () => {
        const page = await listNotasFiscais(driver, { ncm: '6109' });
        expect(page.data.length).toBe(2);
    });
});

describe('produto.queries', () => {
    it('topProdutos retorna ranking com preço médio', async () => {
        const ranking = await topProdutos(driver, { metrica: 'valor', limit: 10 });
        expect(ranking.length).toBeGreaterThanOrEqual(1);
        expect(ranking[0]!.posicao).toBe(1);
        expect(ranking[0]!.precoMedio).toBeGreaterThan(0);
        expect(ranking[0]!.ncm).toBe('61091000');
    });
});
