import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, API_PREFIX } from './app.js';

let app: FastifyInstance | undefined;
afterEach(async () => {
    await app?.close();
    app = undefined;
});

describe('buildApp', () => {
    it('responde no prefixo /api/v1', async () => {
        app = await buildApp({ rateLimit: false });
        const res = await app.inject({ method: 'GET', url: `${API_PREFIX}/ping` });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ pong: true });
    });

    it('serve a especificação OpenAPI 3.1 (e /docs)', async () => {
        app = await buildApp({ rateLimit: false });
        await app.ready();
        const spec = app.swagger() as { openapi: string; info: { title: string } };
        expect(spec.openapi).toBe('3.1.0');
        expect(spec.info.title).toBe('notagrafo API');

        const docs = await app.inject({ method: 'GET', url: '/docs' });
        // /docs redireciona para /docs/ (Swagger UI)
        expect([200, 302]).toContain(docs.statusCode);
    });

    it('404 retorna o envelope de erro padrão com requestId', async () => {
        app = await buildApp({ rateLimit: false });
        const res = await app.inject({ method: 'GET', url: '/api/v1/inexistente' });
        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body).toMatchObject({ error: 'NOT_FOUND' });
        expect(typeof body.message).toBe('string');
        expect(typeof body.requestId).toBe('string');
        expect(body.requestId.length).toBeGreaterThan(0);
    });

    it('cada resposta tem um requestId distinto', async () => {
        app = await buildApp({ rateLimit: false });
        const r1 = await app.inject({ method: 'GET', url: '/api/v1/x' });
        const r2 = await app.inject({ method: 'GET', url: '/api/v1/y' });
        expect(r1.json().requestId).not.toBe(r2.json().requestId);
    });

    it('erro de validação de schema vira BAD_REQUEST no envelope', async () => {
        app = await buildApp({ rateLimit: false });
        app.get(
            '/api/v1/echo',
            { schema: { querystring: { type: 'object', required: ['n'], properties: { n: { type: 'integer' } } } } },
            async () => ({ ok: true }),
        );
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/api/v1/echo' });
        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe('BAD_REQUEST');
        expect(res.json().requestId).toBeTruthy();
    });
});
