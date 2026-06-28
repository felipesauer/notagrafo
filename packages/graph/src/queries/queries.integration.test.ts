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
import { listNotasFiscais, countNotasFiscais, filtrosAtivos, getNotaFiscal } from './nf.queries.js';
import { topProdutos, historicoPrecoProduto } from './produto.queries.js';

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

    it('cobre os demais filtros do contrato (valor/data/cfop/dest/tipo/finalidade/natureza)', async () => {
        // as 2 NFs do setup: valorTotal=10, dataEmissao 2026-06-26, CFOP 5102,
        // destinatário CNPJ 99999999000191 / UF SP, tipoNF saida, finalidade normal, natOp VENDA.
        const casa = [
            { valorTotalMin: 5, valorTotalMax: 50 },
            { dataEmissaoInicio: '2026-06-01', dataEmissaoFim: '2026-06-30' },
            { cfop: '5102' },
            { cnpjDestinatario: '99999999000191' },
            { ufDestinatario: 'SP' },
            { tipoNF: 'saida' },
            { finalidade: 'normal' },
            { naturezaOp: 'venda' }, // contains case-insensitive
        ];
        for (const f of casa) {
            const page = await listNotasFiscais(driver, f);
            expect(page.data.length, `filtro ${JSON.stringify(f)} deveria casar as 2 NFs`).toBe(2);
        }

        // filtros que NÃO casam → 0 resultados
        const naoCasa = [
            { valorTotalMin: 1000 },
            { valorTotalMax: 1 },
            { dataEmissaoInicio: '2027-01-01' },
            { cfop: '6102' },
            { ufDestinatario: 'MG' },
            { tipoNF: 'entrada' },
            { finalidade: 'devolucao' },
        ];
        for (const f of naoCasa) {
            const page = await listNotasFiscais(driver, f);
            expect(page.data.length, `filtro ${JSON.stringify(f)} não deveria casar`).toBe(0);
        }
    });

    it('countNotasFiscais respeita os filtros (DISTINCT por nota)', async () => {
        // sem filtro: total de NFs do setup
        expect(await countNotasFiscais(driver, {})).toBe(2);
        // filtro por emitente ativo: 2
        expect(await countNotasFiscais(driver, { status: 'ativa', cnpjEmitente: EMIT })).toBe(2);
        // filtro por NCM com produto repetido em 2 notas → ainda 2 (DISTINCT)
        expect(await countNotasFiscais(driver, { ncm: '6109' })).toBe(2);
        // filtro impossível: 0
        expect(await countNotasFiscais(driver, { status: 'cancelada' })).toBe(0);
    });

    it('filtrosAtivos lista apenas chaves preenchidas', () => {
        expect(filtrosAtivos({ status: 'ativa', ufEmitente: 'SP', numero: '' })).toEqual(['status', 'ufEmitente']);
        expect(filtrosAtivos({})).toEqual([]);
    });

    it('getNotaFiscal retorna detalhe com emitente, destinatário e itens', async () => {
        const chave = '35200114200166000187550010000000071234567890';
        const nf = await getNotaFiscal(driver, chave);
        expect(nf).not.toBeNull();
        expect(nf!.chaveAcesso).toBe(chave);
        expect((nf!.emitente as { cnpj: string }).cnpj).toBe(EMIT);
        expect(nf!.destinatario).toBeTruthy();
        const itens = nf!.itens as Array<{ produto?: { ncm?: string }; ncm?: { codigo?: string } }>;
        expect(Array.isArray(itens)).toBe(true);
        expect(itens.length).toBeGreaterThanOrEqual(1);
        expect(itens[0]!.produto).toBeTruthy();
    });

    it('getNotaFiscal retorna null para chave inexistente', async () => {
        expect(await getNotaFiscal(driver, '00000000000000000000000000000000000000000000')).toBeNull();
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

    it('historicoPrecoProduto agrega por período com preço médio', async () => {
        const ranking = await topProdutos(driver, { metrica: 'valor', limit: 1 });
        const idUnico = ranking[0]!.idUnico;
        const historico = await historicoPrecoProduto(driver, idUnico);
        expect(historico.length).toBeGreaterThanOrEqual(1);
        // o produto aparece nas 2 NFs do setup, emitidas em 2026-06 → 1 período agregado
        const ponto = historico[0]!;
        expect(ponto.periodo).toMatch(/^\d{4}-\d{2}$/);
        expect(ponto.quantidadeTotal).toBeGreaterThan(0);
        expect(ponto.precoMedio).toBeGreaterThan(0);
        expect(ponto.totalNFs).toBe(2);
    });

    it('historicoPrecoProduto retorna vazio para produto inexistente', async () => {
        expect(await historicoPrecoProduto(driver, 'inexistente')).toEqual([]);
    });
});
