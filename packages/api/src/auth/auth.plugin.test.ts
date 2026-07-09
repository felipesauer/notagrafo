import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from '../errors.js';
import { authPlugin, isAuthRequired } from './auth.plugin.js';

let app: FastifyInstance;
const SAVED = {
    AUTH_ENABLED: process.env.AUTH_ENABLED,
    DEMO: process.env.DEMO,
    DEMO_AUTH_ENABLED: process.env.DEMO_AUTH_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
};
afterEach(async () => {
    await app?.close();
    // restaura flags para não vazar entre testes/arquivos
    for (const [k, v] of Object.entries(SAVED)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
});

/** Constrói o app capturando os logs (spy no logger do Fastify). */
async function buildComLogSpy(): Promise<{ app: FastifyInstance; errors: string[]; warns: string[] }> {
    process.env.AUTH_SECRET = 'test-secret';
    const errors: string[] = [];
    const warns: string[] = [];
    const push = (arr: string[]) => (o: unknown) => arr.push(typeof o === 'string' ? o : JSON.stringify(o));
    const logger = {
        error: push(errors),
        warn: push(warns),
        info: () => {}, debug: () => {}, fatal: () => {}, trace: () => {}, silent: () => {},
        level: 'info',
    };
    // O factory de child logger devolve o mesmo espião (o plugin loga no logger raiz).
    (logger as unknown as { child: () => unknown }).child = () => logger;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = Fastify({ loggerInstance: logger as any });
    await a.register(authPlugin);
    await a.ready();
    return { app: a, errors, warns };
}

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

    it('auth desligada + NODE_ENV=production → banner de aviso em nível error (NOTA-208)', async () => {
        process.env.AUTH_ENABLED = 'false';
        delete process.env.DEMO;
        process.env.NODE_ENV = 'production';
        const built = await buildComLogSpy();
        app = built.app;
        expect(built.errors.join('\n')).toMatch(/AUTENTICAÇÃO DESABILITADA EM PRODUÇÃO/);
        expect(built.warns.join('\n')).not.toMatch(/DESABILITADA/); // é error, não warn
    });

    it('auth desligada fora de produção → apenas warn discreto, sem banner de error (NOTA-208)', async () => {
        process.env.AUTH_ENABLED = 'false';
        delete process.env.DEMO;
        process.env.NODE_ENV = 'development';
        const built = await buildComLogSpy();
        app = built.app;
        expect(built.warns.join('\n')).toMatch(/Autenticação DESABILITADA/);
        expect(built.errors.join('\n')).not.toMatch(/PRODUÇÃO/);
    });

    it('auth LIGADA → nenhum aviso de desabilitada (NOTA-208)', async () => {
        process.env.AUTH_ENABLED = 'true';
        delete process.env.DEMO;
        process.env.NODE_ENV = 'production';
        const built = await buildComLogSpy();
        app = built.app;
        expect(built.errors.join('\n')).not.toMatch(/DESABILITADA/);
        expect(built.warns.join('\n')).not.toMatch(/DESABILITADA/);
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
