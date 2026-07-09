import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { Driver } from 'neo4j-driver';

const repo = vi.hoisted(() => ({
    findByEmail: vi.fn(),
    findById: vi.fn(),
    verifyPassword: vi.fn(),
    createUser: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
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
        repo.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A', senhaHash: 'h' });
        repo.verifyPassword.mockResolvedValue(true);
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com', password: 'p' } });
        expect(res.statusCode).toBe(200);
        expect(res.json().token).toBeTruthy();
        expect(res.json().user).toEqual({ id: 'u1', email: 'a@b.com', nome: 'A' });
        expect(res.json().expiresAt).toBeTruthy();
    });

    it('401 quando usuário não existe ou senha errada', async () => {
        repo.findByEmail.mockResolvedValue(null);
        app = await build();
        const r1 = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'x@b.com', password: 'p' } });
        expect(r1.statusCode).toBe(401);

        repo.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A', senhaHash: 'h' });
        repo.verifyPassword.mockResolvedValue(false);
        app = await build();
        const r2 = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com', password: 'errada' } });
        expect(r2.statusCode).toBe(401);
        expect(r2.json().error).toBe('INVALID_CREDENTIALS');
    });

    it('400 quando o e-mail não tem formato válido (NOTA-205)', async () => {
        repo.findByEmail.mockResolvedValue(null);
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'sem-arroba', password: 'p' } });
        expect(res.statusCode).toBe(400);
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
    it('renova um token recém-expirado (dentro da janela de 24h)', async () => {
        app = await build();
        // Expirou há ~1h (exp no passado, mas dentro das últimas 24h).
        const token = app.jwt.sign({ sub: 'u1', email: 'a', nome: 'A' }, { expiresIn: '-1h' });
        const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { token } });
        expect(res.statusCode).toBe(200);
        expect(res.json().token).toBeTruthy();
    });
    it('401 para token expirado há mais de 24h', async () => {
        app = await build();
        const token = app.jwt.sign({ sub: 'u1', email: 'a', nome: 'A' }, { expiresIn: '-25h' });
        const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { token } });
        expect(res.statusCode).toBe(401);
    });
});

describe('GET /auth/me (unit)', () => {
    it('200 com o usuário do token', async () => {
        repo.findById.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A' });
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/auth/me' });
        expect(res.statusCode).toBe(200);
        expect(res.json().email).toBe('a@b.com');
    });
    it('404 USER_NOT_FOUND quando o usuário sumiu', async () => {
        repo.findById.mockResolvedValue(null);
        app = await build();
        const res = await app.inject({ method: 'GET', url: '/auth/me' });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('USER_NOT_FOUND');
    });
});

describe('POST /auth/register (unit)', () => {
    it('201/200 cria conta e retorna token', async () => {
        repo.findByEmail.mockResolvedValue(null); // e-mail livre
        repo.createUser.mockResolvedValue({ id: 'u9', email: 'novo@b.com', nome: 'Novo' });
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'novo@b.com', password: 'segredo8', nome: 'Novo' } });
        expect(res.statusCode).toBe(200);
        expect(res.json().token).toBeTruthy();
        expect(res.json().user).toEqual({ id: 'u9', email: 'novo@b.com', nome: 'Novo' });
    });
    it('409 quando o e-mail já existe', async () => {
        repo.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', nome: 'A', senhaHash: 'h' });
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com', password: 'segredo8', nome: 'A' } });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('EMAIL_IN_USE');
        expect(repo.createUser).not.toHaveBeenCalled();
    });
    it('400 quando falta campo obrigatório', async () => {
        app = await build();
        const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com' } });
        expect(res.statusCode).toBe(400);
    });
});

describe('PATCH /auth/me (unit)', () => {
    it('200 altera nome/e-mail e reemite token', async () => {
        repo.updateProfile.mockResolvedValue({ id: 'u1', email: 'novo@b.com', nome: 'Novo Nome' });
        app = await build();
        const res = await app.inject({ method: 'PATCH', url: '/auth/me', payload: { nome: 'Novo Nome', email: 'novo@b.com' } });
        expect(res.statusCode).toBe(200);
        expect(res.json().user.email).toBe('novo@b.com');
        expect(res.json().token).toBeTruthy();
        // o novo token carrega os claims atualizados
        const claims = app.jwt.decode<{ email: string; nome: string }>(res.json().token);
        expect(claims?.email).toBe('novo@b.com');
        expect(claims?.nome).toBe('Novo Nome');
    });
    it('409 quando o e-mail novo já é de outro usuário', async () => {
        repo.updateProfile.mockRejectedValue(new Error('EMAIL_IN_USE'));
        app = await build();
        const res = await app.inject({ method: 'PATCH', url: '/auth/me', payload: { email: 'ocupado@b.com' } });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('EMAIL_IN_USE');
    });
});

describe('PATCH /auth/password (unit)', () => {
    it('204 quando a senha atual confere', async () => {
        repo.updatePassword.mockResolvedValue(undefined);
        app = await build();
        const res = await app.inject({ method: 'PATCH', url: '/auth/password', payload: { senhaAtual: 'atual', novaSenha: 'novasenha' } });
        expect(res.statusCode).toBe(204);
    });
    it('401 quando a senha atual está errada', async () => {
        repo.updatePassword.mockRejectedValue(new Error('WRONG_PASSWORD'));
        app = await build();
        const res = await app.inject({ method: 'PATCH', url: '/auth/password', payload: { senhaAtual: 'errada', novaSenha: 'novasenha' } });
        expect(res.statusCode).toBe(401);
    });
    it('400 quando a nova senha é curta demais', async () => {
        app = await build();
        const res = await app.inject({ method: 'PATCH', url: '/auth/password', payload: { senhaAtual: 'atual', novaSenha: '123' } });
        expect(res.statusCode).toBe(400);
    });
});
