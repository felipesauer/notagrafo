import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Neo4jContainer, type StartedNeo4jContainer } from '@testcontainers/neo4j';
import neo4j, { type Driver } from 'neo4j-driver';
import { buildApp, API_PREFIX } from '../app.js';
import { criarUsuario } from './user.repository.js';

let container: StartedNeo4jContainer;
let driver: Driver;
let app: FastifyInstance;

const EMAIL = 'usuario@empresa.com';
const SENHA = 'senha123';

beforeAll(async () => {
    container = await new Neo4jContainer('neo4j:5-community').withPassword('testpassword').start();
    driver = neo4j.driver(container.getBoltUri(), neo4j.auth.basic(container.getUsername(), container.getPassword()));
    process.env.AUTH_SECRET = 'test-secret-para-jwt';
    process.env.AUTH_JWT_EXPIRES_IN = '7d';
    await criarUsuario(driver, { email: EMAIL, nome: 'João Silva', senha: SENHA });
    app = await buildApp({ rateLimit: false, driver });
    await app.ready();
}, 120_000);

afterAll(async () => {
    await app?.close();
    await driver?.close();
    await container?.stop();
});

const url = (p: string): string => `${API_PREFIX}${p}`;

async function login(password = SENHA): Promise<string> {
    const res = await app.inject({ method: 'POST', url: url('/auth/login'), payload: { email: EMAIL, password } });
    return res.json().token;
}

describe('auth (JWT manual, Neo4j real)', () => {
    it('POST /auth/login retorna token, expiresAt e user', async () => {
        const res = await app.inject({ method: 'POST', url: url('/auth/login'), payload: { email: EMAIL, password: SENHA } });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(typeof body.token).toBe('string');
        expect(typeof body.expiresAt).toBe('string');
        expect(body.user).toMatchObject({ email: EMAIL, nome: 'João Silva' });
        expect(body.user.id).toBeTruthy();
    });

    it('credenciais inválidas → 401 INVALID_CREDENTIALS', async () => {
        const res = await app.inject({ method: 'POST', url: url('/auth/login'), payload: { email: EMAIL, password: 'errada' } });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('INVALID_CREDENTIALS');
    });

    it('rota protegida sem Bearer → 401 UNAUTHORIZED', async () => {
        const res = await app.inject({ method: 'GET', url: url('/auth/me') });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe('UNAUTHORIZED');
    });

    it('GET /auth/me com Bearer retorna o usuário', async () => {
        const token = await login();
        const res = await app.inject({ method: 'GET', url: url('/auth/me'), headers: { authorization: `Bearer ${token}` } });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({ email: EMAIL, nome: 'João Silva' });
        expect(res.json().criadoEm).toBeTruthy();
    });

    it('POST /auth/refresh renova o token', async () => {
        const token = await login();
        const res = await app.inject({ method: 'POST', url: url('/auth/refresh'), payload: { token } });
        expect(res.statusCode).toBe(200);
        expect(typeof res.json().token).toBe('string');
        expect(typeof res.json().expiresAt).toBe('string');
    });

    it('POST /auth/logout → 204', async () => {
        const res = await app.inject({ method: 'POST', url: url('/auth/logout') });
        expect(res.statusCode).toBe(204);
    });

    it('a senha é armazenada como hash bcrypt no Neo4j (nunca em texto)', async () => {
        const session = driver.session();
        try {
            const r = await session.run('MATCH (u:Usuario {email: $email}) RETURN u.senhaHash AS h', { email: EMAIL });
            const hash = r.records[0]!.get('h') as string;
            expect(hash).not.toBe(SENHA);
            expect(hash.startsWith('$2')).toBe(true); // prefixo bcrypt
        } finally {
            await session.close();
        }
    });
});
