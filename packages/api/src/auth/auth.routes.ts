import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import { ApiError } from '../errors.js';
import { findByEmail, findById, verifyPassword } from './user.repository.js';
import type { JwtClaims } from './auth.plugin.js';

interface LoginBody {
    email: string;
    password: string;
}
interface RefreshBody {
    token: string;
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
            schema: {
                tags: ['auth'],
                summary: 'Autentica e retorna um JWT',
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: { email: { type: 'string' }, password: { type: 'string' } },
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
}
