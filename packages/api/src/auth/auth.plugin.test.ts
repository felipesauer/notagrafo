import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from '../errors.js';
import { authPlugin, isAuthRequired } from './auth.plugin.js';

let app: FastifyInstance;
const SAVED = { AUTH_ENABLED: process.env.AUTH_ENABLED, DEMO: process.env.DEMO, DEMO_AUTH_ENABLED: process.env.DEMO_AUTH_ENABLED };
afterEach(async () => {
    await app?.close();
    // restaura flags para não vazar entre testes/arquivos
    for (const [k, v] of Object.entries(SAVED)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
});

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

    it('AUTH_ENABLED=false: rota protegida fica aberta sem token', async () => {
        process.env.AUTH_ENABLED = 'false';
        delete process.env.DEMO;
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/protegido' });
        expect(res.statusCode).toBe(200);
        expect(res.json().ok).toBe(true);
    });

    it('DEMO=true + DEMO_AUTH_ENABLED=false sobrepõe AUTH_ENABLED=true', async () => {
        process.env.AUTH_ENABLED = 'true';
        process.env.DEMO = 'true';
        process.env.DEMO_AUTH_ENABLED = 'false';
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/protegido' });
        expect(res.statusCode).toBe(200);
    });
});

describe('isAuthRequired', () => {
    it('padrão (sem flags) é true', () => {
        expect(isAuthRequired({})).toBe(true);
    });

    it('AUTH_ENABLED=false desliga fora do modo demo', () => {
        expect(isAuthRequired({ AUTH_ENABLED: 'false' })).toBe(false);
    });

    it('em modo demo, DEMO_AUTH_ENABLED sobrepõe AUTH_ENABLED', () => {
        expect(isAuthRequired({ DEMO: 'true', DEMO_AUTH_ENABLED: 'false', AUTH_ENABLED: 'true' })).toBe(false);
        expect(isAuthRequired({ DEMO: 'true', DEMO_AUTH_ENABLED: 'true', AUTH_ENABLED: 'false' })).toBe(true);
    });
});
