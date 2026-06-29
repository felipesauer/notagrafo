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
import { mergeInvoice, type InvoiceToPersist } from '../nf.repository.js';
import { taxSummary, taxByNcm, taxByCfop } from './tax.queries.js';
import { productCompanies } from './product.queries.js';
import { getCompanyGraph } from './company.queries.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');

let container: StartedNeo4jContainer;
let driver: Driver;

function payload(xml: string): InvoiceToPersist {
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

const EMIT = '14200166000187';

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start();
    driver = neo4j.driver(container.getBoltUri(), neo4j.auth.basic(container.getUsername(), container.getPassword()));
    await runMigrations(driver);

    // Grafo fiscal próprio: NF tributada (impostos != 0, NCM 84/CFOP 6102) + a NF
    // simples (NCM 61/CFOP 5102) + uma devolução referenciando a simples.
    await mergeInvoice(driver, payload(readFileSync(join(FIXTURES, 'nfe-tributada-v4.00.xml'), 'utf8')));
    await mergeInvoice(driver, payload(readFileSync(join(FIXTURES, 'nfe-valida-v4.00.xml'), 'utf8')));
    await mergeInvoice(driver, payload(readFileSync(join(FIXTURES, 'nfe-devolucao-ref-v4.00.xml'), 'utf8')));
}, 120_000);

afterAll(async () => {
    await driver?.close();
    await container?.stop();
});

describe('taxSummary (Neo4j real)', () => {
    it('soma os tributos das NFs (total_* do nó) e monta a série mensal', async () => {
        const out = await taxSummary(driver, {});
        // só a NF tributada tem imposto != 0 (vICMS 180, vIPI 50, vPIS 16.5, vCOFINS 76, FCP 20, ST 72)
        expect(out.totais.vICMS).toBe(180);
        expect(out.totais.vIPI).toBe(50);
        expect(out.totais.vPIS).toBe(16.5);
        expect(out.totais.vCOFINS).toBe(76);
        expect(out.totais.vFCP).toBe(20);
        expect(out.totais.vICMSST).toBe(72);
        expect(out.serie.length).toBeGreaterThanOrEqual(1);
        expect(out.serie.every((p) => /^\d{4}-\d{2}$/.test(p.periodo))).toBe(true);
    });

    it('filtra por UF do emitente', async () => {
        expect((await taxSummary(driver, { uf: 'SP' })).totais.vICMS).toBe(180); // emitente é SP
        expect((await taxSummary(driver, { uf: 'MG' })).totais.vICMS).toBe(0); // ninguém em MG
    });
});

describe('taxByNcm (Neo4j real)', () => {
    it('agrega imposto por NCM e traz a descrição do catálogo', async () => {
        const out = await taxByNcm(driver, {}, 10);
        const top = out[0]!;
        // a NF tributada (NCM 84713012) concentra o imposto → 1º lugar
        expect(top.ncm).toBe('84713012');
        expect(top.descricao).toContain('Máquinas');
        expect(top.totalImposto).toBeGreaterThan(0);
        expect(top.vICMS).toBe(252); // 180 ICMS + 72 ICMS-ST
    });
});

describe('taxByCfop (Neo4j real)', () => {
    it('agrega imposto por CFOP com descrição/tipo do catálogo', async () => {
        const out = await taxByCfop(driver, {}, 10);
        const cfop6102 = out.find((c) => c.cfop === '6102')!;
        expect(cfop6102).toBeTruthy();
        expect(cfop6102.tipo).toBe('saida');
        expect(cfop6102.vICMS).toBe(180);
    });
});

describe('productCompanies (Neo4j real)', () => {
    it('retorna emitente e destinatário do produto tributado com valor', async () => {
        // idUnico do produto tributado = EAN 7891234567895
        const empresas = await productCompanies(driver, '7891234567895');
        expect(empresas.length).toBeGreaterThanOrEqual(2);
        const emit = empresas.find((e) => e.papel === 'emitente')!;
        const dest = empresas.find((e) => e.papel === 'destinatario')!;
        expect(emit.cnpj).toBe(EMIT);
        expect(emit.valor).toBe(1000);
        expect(dest.cnpj).toBe('99999999000191');
    });
});

describe('getCompanyGraph includeProdutos (Neo4j real)', () => {
    it('retorna os produtos da empresa-raiz quando includeProdutos=true', async () => {
        const grafo = await getCompanyGraph(driver, EMIT, { depth: 1, includeProdutos: true });
        expect(grafo.produtos).toBeTruthy();
        expect(grafo.produtos!.length).toBeGreaterThanOrEqual(1);
        expect(grafo.produtos!.every((p) => p.idUnico && p.valorTotal >= 0)).toBe(true);
    });

    it('arestas trazem valorTotal agregado', async () => {
        const grafo = await getCompanyGraph(driver, EMIT, { depth: 1 });
        expect(grafo.arestas.every((a) => typeof a.valorTotal === 'number')).toBe(true);
    });
});
