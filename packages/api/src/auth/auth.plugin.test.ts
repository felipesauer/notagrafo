import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from '../errors.js';
import { authPlugin } from './auth.plugin.js';

let app: FastifyInstance;
afterEach(async () => app?.close());

async function build(): Promise<FastifyInstance> {
    process.env.AUTH_SECRET = 'test-secret';
    const a = Fastify();
    a.setErrorHandler(errorHandler);
    await a.register(authPlugin);
    a.get('/protegido', { preHandler: a.authenticate }, async () => ({ ok: true }));
    await a.ready();
    return a;
}

describe('authPlugin (unit)', () => {
    it('falha ao iniciar sem AUTH_SECRET', async () => {
        const saved = process.env.AUTH_SECRET;
        delete process.env.AUTH_SECRET;
        const a = Fastify();
        await expect(a.register(authPlugin).ready()).rejects.toThrow(/AUTH_SECRET/);
        process.env.AUTH_SECRET = saved;
    });

    it('401 sem Bearer; 200 com token válido', async () => {
        app = await build();
        const semToken = await app.inject({ method: 'GET', url: '/protegido' });
        expect(semToken.statusCode).toBe(401);
        expect(semToken.json().error).toBe('UNAUTHORIZED');

        const token = app.jwt.sign({ sub: 'u1', email: 'a', nome: 'A' });
        const comToken = await app.inject({ method: 'GET', url: '/protegido', headers: { authorization: `Bearer ${token}` } });
        expect(comToken.statusCode).toBe(200);
        expect(comToken.json().ok).toBe(true);
    });

    it('401 com token malformado', async () => {
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/protegido', headers: { authorization: 'Bearer lixo' } });
        expect(res.statusCode).toBe(401);
    });
});
