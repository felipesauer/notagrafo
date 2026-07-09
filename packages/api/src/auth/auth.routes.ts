import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import { ApiError } from '../errors.js';
import { findByEmail, findById, verifyPassword, createUser, updateProfile, updatePassword } from './user.repository.js';
import type { JwtClaims } from './auth.plugin.js';

interface LoginBody {
    email: string;
    password: string;
}
interface RefreshBody {
    token: string;
}
interface RegisterBody {
    email: string;
    password: string;
    nome: string;
}
interface UpdateMeBody {
    nome?: string;
    email?: string;
}
interface UpdatePasswordBody {
    senhaAtual: string;
    novaSenha: string;
}

/** Janela de tolerância para refresh de token recém-expirado (contrato §1: 24h). */
const REFRESH_GRACE_MS = 24 * 60 * 60 * 1000;

/** Calcula a data de expiração de um token recém-assinado (a partir do exp). */
function expiresAtFromToken(app: FastifyInstance, token: string): string {
    const decoded = app.jwt.decode<{ exp?: number }>(token);
    const exp = decoded?.exp;
    return exp ? new Date(exp * 1000).toISOString() : new Date().toISOString();
}

/** Registra as rotas /auth/* (contrato da seção 1 do 02 contratos api.md). */
export async function authRoutes(app: FastifyInstance, driver: Driver): Promise<void> {
    // POST /auth/login — público
    app.post<{ Body: LoginBody }>(
        '/auth/login',
        {
            // Teto dedicado, mais estrito que o global (100/min), contra brute-force
            // de credencial: 10 tentativas/min por IP (NOTA-205).
            config: { rateLimit: { max: 10, timeWindow: 60_000 } },
            schema: {
                tags: ['auth'],
                summary: 'Autentica e retorna um JWT',
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 1 },
                    },
                },
            },
        },
        async (request) => {
            const { email, password } = request.body;
            const user = await findByEmail(driver, email);
            if (!user || !(await verifyPassword(password, user.senhaHash))) {
                throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
            }
            const claims: JwtClaims = { sub: user.id, email: user.email, nome: user.nome };
            const token = app.jwt.sign(claims);
            return {
                token,
                expiresAt: expiresAtFromToken(app, token),
                user: { id: user.id, email: user.email, nome: user.nome },
            };
        },
    );

    // POST /auth/logout — stateless: 204 (o cliente descarta o token)
    app.post(
        '/auth/logout',
        { schema: { tags: ['auth'], summary: 'Logout (stateless)' } },
        async (_request, reply) => {
            reply.status(204).send();
        },
    );

    // POST /auth/refresh — público; renova um token ainda válido
    app.post<{ Body: RefreshBody }>(
        '/auth/refresh',
        {
            schema: {
                tags: ['auth'],
                summary: 'Renova um JWT válido',
                body: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
            },
        },
        async (request) => {
            // Contrato §1: aceita token ainda válido OU recém-expirado dentro de
            // uma janela de 24h. Verificamos a assinatura ignorando a expiração e
            // aplicamos a janela manualmente sobre o claim `exp`.
            let claims: JwtClaims & { exp?: number };
            try {
                claims = app.jwt.verify<JwtClaims & { exp?: number }>(request.body.token, {
                    ignoreExpiration: true,
                });
            } catch {
                throw ApiError.unauthorized('Token inválido para refresh.');
            }
            if (claims.exp !== undefined) {
                const expiradoHaMs = Date.now() - claims.exp * 1000;
                if (expiradoHaMs > REFRESH_GRACE_MS) {
                    throw ApiError.unauthorized('Token expirado há mais de 24h; faça login novamente.');
                }
            }
            const freshToken = app.jwt.sign({ sub: claims.sub, email: claims.email, nome: claims.nome });
            return { token: freshToken, expiresAt: expiresAtFromToken(app, freshToken) };
        },
    );

    // GET /auth/me — protegido
    app.get(
        '/auth/me',
        {
            schema: { tags: ['auth'], summary: 'Dados do usuário autenticado', security: [{ bearerAuth: [] }] },
            preHandler: app.authenticate,
        },
        async (request) => {
            const user = await findById(driver, request.user.sub);
            if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Usuário não encontrado.');
            return user;
        },
    );

    // POST /auth/register — público; cria conta e já retorna um token (como o login)
    app.post<{ Body: RegisterBody }>(
        '/auth/register',
        {
            // Teto dedicado contra abuso de criação de contas (NOTA-205).
            config: { rateLimit: { max: 10, timeWindow: 60_000 } },
            schema: {
                tags: ['auth'],
                summary: 'Cria uma conta e retorna um JWT',
                body: {
                    type: 'object',
                    required: ['email', 'password', 'nome'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        nome: { type: 'string', minLength: 1 },
                    },
                },
            },
        },
        async (request) => {
            const { email, password, nome } = request.body;
            // createUser é idempotente por e-mail (MERGE); detectamos duplicata
            // consultando antes, para responder 409 em vez de "logar" numa conta alheia.
            const existente = await findByEmail(driver, email);
            if (existente) {
                throw new ApiError(409, 'EMAIL_IN_USE', 'Já existe uma conta com este e-mail.');
            }
            const user = await createUser(driver, { email, nome, senha: password });
            const claims: JwtClaims = { sub: user.id, email: user.email, nome: user.nome };
            const token = app.jwt.sign(claims);
            return {
                token,
                expiresAt: expiresAtFromToken(app, token),
                user: { id: user.id, email: user.email, nome: user.nome },
            };
        },
    );

    // PATCH /auth/me — protegido; altera nome/e-mail e REEMITE o token (claims mudam)
    app.patch<{ Body: UpdateMeBody }>(
        '/auth/me',
        {
            schema: {
                tags: ['auth'],
                summary: 'Atualiza nome/e-mail do usuário autenticado',
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        nome: { type: 'string', minLength: 1 },
                        email: { type: 'string', minLength: 3 },
                    },
                },
            },
            preHandler: app.authenticate,
        },
        async (request) => {
            const { nome, email } = request.body;
            let user;
            try {
                user = await updateProfile(driver, request.user.sub, {
                    ...(nome !== undefined ? { nome } : {}),
                    ...(email !== undefined ? { email } : {}),
                });
            } catch (err) {
                if ((err as Error).message === 'EMAIL_IN_USE') {
                    throw new ApiError(409, 'EMAIL_IN_USE', 'Já existe uma conta com este e-mail.');
                }
                if ((err as Error).message === 'USER_NOT_FOUND') {
                    throw ApiError.notFound('USER_NOT_FOUND', 'Usuário não encontrado.');
                }
                throw err;
            }
            // nome/e-mail vivem nos claims do JWT → reemite para a sessão ficar coerente.
            const token = app.jwt.sign({ sub: user.id, email: user.email, nome: user.nome });
            return { token, expiresAt: expiresAtFromToken(app, token), user };
        },
    );

    // PATCH /auth/password — protegido; troca a senha validando a atual
    app.patch<{ Body: UpdatePasswordBody }>(
        '/auth/password',
        {
            schema: {
                tags: ['auth'],
                summary: 'Troca a senha do usuário autenticado',
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['senhaAtual', 'novaSenha'],
                    properties: {
                        senhaAtual: { type: 'string' },
                        novaSenha: { type: 'string', minLength: 6 },
                    },
                },
            },
            preHandler: app.authenticate,
        },
        async (request, reply) => {
            const { senhaAtual, novaSenha } = request.body;
            try {
                await updatePassword(driver, request.user.sub, senhaAtual, novaSenha);
            } catch (err) {
                const msg = (err as Error).message;
                if (msg === 'WRONG_PASSWORD') throw ApiError.unauthorized('Senha atual incorreta.');
                if (msg === 'USER_NOT_FOUND') throw ApiError.notFound('USER_NOT_FOUND', 'Usuário não encontrado.');
                throw err;
            }
            reply.status(204).send();
        },
    );
}
