import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { Driver } from 'neo4j-driver';

const repo = vi.hoisted(() => ({
    buscarPorEmail: vi.fn(),
    buscarPorId: vi.fn(),
    verificarSenha: vi.fn(),
}));
vi.mock('./user.repository.js', () => repo);

import { buildTestApi } from '../__test-helpers__/build-test-api.js';
import { authRoutes } from './auth.routes.js';

const fakeDriver = {} as Driver;
let app: FastifyInstance;
afterEach(async () => app?.close());
beforeEach(() => Object.values(repo).forEach((f) => f.mockReset()));

async function build(): Promise<FastifyInstance> {
    return buildTestApi(async (a) => {
        await a.register(fastifyJwt, { secret: 'test-secret' });
        await authRoutes(a, fakeDriver);
    });
}

describe('POST /auth/login (unit)', () => {
    it('200 com token quando credenciais válidas', async () => {
        repo.buscarPorEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A', senhaHash: 'h' });
        repo.verificarSenha.mockResolvedValue(true);
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com', password: 'p' } });
        expect(res.statusCode).toBe(200);
        expect(res.json().token).toBeTruthy();
        expect(res.json().user).toEqual({ id: 'u1', email: 'a@b.com', nome: 'A' });
        expect(res.json().expiresAt).toBeTruthy();
    });

    it('401 quando usuário não existe ou senha errada', async () => {
        repo.buscarPorEmail.mockResolvedValue(null);
        app = await build();
        const r1 = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'x', password: 'p' } });
        expect(r1.statusCode).toBe(401);

        repo.buscarPorEmail.mockResolvedValue({ id: 'u1', email: 'a', nome: 'A', senhaHash: 'h' });
        repo.verificarSenha.mockResolvedValue(false);
        app = await build();
        const r2 = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a', password: 'errada' } });
        expect(r2.statusCode).toBe(401);
        expect(r2.json().error).toBe('INVALID_CREDENTIALS');
    });
});

describe('POST /auth/logout (unit)', () => {
    it('204', async () => {
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/logout' });
        expect(res.statusCode).toBe(204);
    });
});

describe('POST /auth/refresh (unit)', () => {
    it('renova um token válido', async () => {
        app = await build();
        const token = app.jwt.sign({ sub: 'u1', email: 'a', nome: 'A' });
        const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { token } });
        expect(res.statusCode).toBe(200);
        expect(res.json().token).toBeTruthy();
    });
    it('401 para token inválido', async () => {
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { token: 'lixo' } });
        expect(res.statusCode).toBe(401);
    });
});

describe('GET /auth/me (unit)', () => {
    it('200 com o usuário do token', async () => {
        repo.buscarPorId.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A' });
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/auth/me' });
        expect(res.statusCode).toBe(200);
        expect(res.json().email).toBe('a@b.com');
    });
    it('404 USER_NOT_FOUND quando o usuário sumiu', async () => {
        repo.buscarPorId.mockResolvedValue(null);
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/auth/me' });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('USER_NOT_FOUND');
    });
});
