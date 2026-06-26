import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import { ApiError } from '../errors.js';
import { buscarPorEmail, buscarPorId, verificarSenha } from './user.repository.js';
import type { JwtClaims } from './auth.plugin.js';

interface LoginBody {
    email: string;
    password: string;
}
interface RefreshBody {
    token: string;
}

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
            const user = await buscarPorEmail(driver, email);
            if (!user || !(await verificarSenha(password, user.senhaHash))) {
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
            let claims: JwtClaims;
            try {
                claims = app.jwt.verify<JwtClaims>(request.body.token);
            } catch {
                throw ApiError.unauthorized('Token inválido ou expirado para refresh.');
            }
            const novo = app.jwt.sign({ sub: claims.sub, email: claims.email, nome: claims.nome });
            return { token: novo, expiresAt: expiresAtFromToken(app, novo) };
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
            const user = await buscarPorId(driver, request.user.sub);
            if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Usuário não encontrado.');
            return user;
        },
    );
}
