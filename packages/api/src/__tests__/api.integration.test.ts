import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { processNFe } from '@notagrafo/worker';
import { API_PREFIX } from '../app.js';
import { setupApiIntegration, type ApiTestContext } from './setup.integration.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'core', 'src', '__fixtures__');
const CHAVE = '35200114200166000187550010000000071234567890';
const CHAVE2 = '35200114200166000187550010000000081234567891';
const xml = (name = 'nfe-valida-v4.00.xml'): string => readFileSync(join(FIXTURES, name), 'utf8');
/** Variante da NFe válida com outra chave/número, para lotes com NFs distintas. */
const xmlOutraChave = (): string => xml().replace(`NFe${CHAVE}`, `NFe${CHAVE2}`).replace('<nNF>7</nNF>', '<nNF>8</nNF>');

let ctx: ApiTestContext;

beforeAll(async () => {
    ctx = await setupApiIntegration();
}, 180_000);

afterAll(async () => {
    await ctx.teardown();
});

// Banco limpo entre testes (AC).
afterEach(async () => {
    await ctx.clearDatabase();
});

function multipart(content: string | Buffer, filename: string, contentType = 'application/xml') {
    const boundary = '----it';
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const body = Buffer.concat([Buffer.from(head, 'utf8'), data, Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')]);
    return { body, headers: { ...ctx.bearer(), 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

describe('API end-to-end (setup.integration compartilhado)', () => {
    it('upload de XML válido → 202', async () => {
        const { body, headers } = multipart(xml(), 'nota.xml');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(202);
        expect(res.json().arquivos).toBe(1);
    });

    it('upload de ZIP com múltiplos XMLs distintos → 202 com a contagem', async () => {
        const zip = new AdmZip();
        zip.addFile('a.xml', Buffer.from(xml()));
        zip.addFile('b.xml', Buffer.from(xmlOutraChave()));
        const { body, headers } = multipart(zip.toBuffer(), 'lote.zip', 'application/zip');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(202);
        expect(res.json().arquivos).toBe(2);
        // duas chaves distintas → dois jobs realmente enfileirados.
        const counts = await ctx.queue.getJobCounts('waiting', 'active', 'delayed');
        expect(counts.waiting + counts.active + counts.delayed).toBe(2);
    });

    it('upload de XML inválido → 422', async () => {
        const { body, headers } = multipart(xml('nfe-invalida-schema.xml'), 'inv.xml');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(422);
    });

    it('ZIP com duplicata intra-lote → 409 sem enfileiramento parcial (atômico)', async () => {
        // mesmo XML duas vezes: a 1ª passa, a 2ª é duplicata da própria carga.
        const zip = new AdmZip();
        zip.addFile('a.xml', Buffer.from(xml()));
        zip.addFile('b.xml', Buffer.from(xml()));
        const { body, headers } = multipart(zip.toBuffer(), 'dup-lote.zip', 'application/zip');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('DUPLICATE_NF');
        // nenhum job foi enfileirado (atomicidade): fila vazia.
        const counts = await ctx.queue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        expect(total).toBe(0);
    });

    it('ZIP onde a 2ª NF já existe no grafo → 409 e a 1ª NF não é enfileirada', async () => {
        // CHAVE2 já está no grafo; o lote tenta [válida-nova (CHAVE), existente (CHAVE2)].
        await processNFe({ xml: xmlOutraChave() }, { driver: ctx.driver, storage: ctx.storage });
        const zip = new AdmZip();
        zip.addFile('a.xml', Buffer.from(xml()));
        zip.addFile('b.xml', Buffer.from(xmlOutraChave()));
        const { body, headers } = multipart(zip.toBuffer(), 'lote.zip', 'application/zip');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(409);
        const counts = await ctx.queue.getJobCounts('waiting', 'active', 'delayed');
        expect(counts.waiting + counts.active + counts.delayed).toBe(0);
    });

    it('upload duplicado → 409', async () => {
        await processNFe({ xml: xml() }, { driver: ctx.driver, storage: ctx.storage });
        const { body, headers } = multipart(xml(), 'dup.xml');
        const res = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/nf/upload`, payload: body, headers });
        expect(res.statusCode).toBe(409);
    });

    it('o afterEach limpou o banco (lista vazia no início)', async () => {
        const res = await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/nf`, headers: ctx.bearer() });
        expect(res.json().data).toHaveLength(0);
    });

    it('listagem com filtros + detalhe + grafo após semear', async () => {
        await processNFe({ xml: xml() }, { driver: ctx.driver, storage: ctx.storage });

        const lista = await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/nf?status=ativa&limit=10`, headers: ctx.bearer() });
        expect(lista.json().data).toHaveLength(1);

        const detalhe = await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/nf/${CHAVE}`, headers: ctx.bearer() });
        expect(detalhe.statusCode).toBe(200);
        expect(detalhe.json().itens.length).toBeGreaterThanOrEqual(1);

        const grafo = await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/empresa/14200166000187/grafo?depth=1`, headers: ctx.bearer() });
        expect(grafo.statusCode).toBe(200);
    });

    it('export end-to-end (202 → ready → download)', async () => {
        await processNFe({ xml: xml() }, { driver: ctx.driver, storage: ctx.storage });
        const post = await ctx.app.inject({ method: 'POST', url: `${API_PREFIX}/export`, headers: ctx.bearer(), payload: { formato: 'json' } });
        expect(post.statusCode).toBe(202);
        const id = post.json().exportId;

        let status = '';
        for (let i = 0; i < 20 && status !== 'ready'; i++) {
            await new Promise((r) => setTimeout(r, 150));
            status = (await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/export/${id}`, headers: ctx.bearer() })).json().status;
        }
        expect(status).toBe('ready');

        const dl = await ctx.app.inject({ method: 'GET', url: `${API_PREFIX}/export/${id}/download`, headers: ctx.bearer() });
        expect(dl.statusCode).toBe(200);
        expect(dl.headers['content-type']).toContain('application/json');
    });
});
