import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../errors.js';

/** Claims do JWT (subset persistido no token). */
export interface JwtClaims {
    sub: string; // user id
    email: string;
    nome: string;
}

declare module 'fastify' {
    interface FastifyInstance {
        /** preHandler que exige um Bearer válido; lança 401 caso contrário. */
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtClaims;
        user: JwtClaims;
    }
}

/**
 * Resolve se a autenticação é exigida a partir das flags de ambiente.
 *
 * - `AUTH_ENABLED` (padrão true): liga/desliga a auth de forma geral.
 * - `DEMO_AUTH_ENABLED` (padrão true): quando `DEMO=true`, SOBREPÕE a geral.
 *
 * Ou seja: em modo demo manda a flag de demo; fora dele manda a geral.
 */
export function isAuthRequired(env: NodeJS.ProcessEnv = process.env): boolean {
    const enabled = (v: string | undefined) => v !== 'false';
    return env.DEMO === 'true' ? enabled(env.DEMO_AUTH_ENABLED) : enabled(env.AUTH_ENABLED);
}

/**
 * Registra @fastify/jwt (AUTH_SECRET / AUTH_JWT_EXPIRES_IN) e o decorator
 * `authenticate`. ADR NOTA-ADR-1: JWT manual, não Better Auth.
 *
 * Quando a auth está desligada (ver {@link isAuthRequired}), `authenticate`
 * vira no-op: as rotas continuam usando o mesmo preHandler, mas nenhum token
 * é exigido. O plugin JWT ainda é registrado para que /auth/login funcione.
 */
export const authPlugin = fp(async (app) => {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('AUTH_SECRET não definido — auth não pode iniciar.');

    await app.register(fastifyJwt, {
        secret,
        sign: { expiresIn: process.env.AUTH_JWT_EXPIRES_IN ?? '7d' },
    });

    const authRequired = isAuthRequired();
    if (!authRequired) {
        app.log.warn('Autenticação DESABILITADA por env (AUTH_ENABLED/DEMO_AUTH_ENABLED) — rotas protegidas estão abertas.');
    }

    app.decorate('authenticate', async (request: FastifyRequest) => {
        if (!authRequired) {
            // Tenta popular request.user se houver Bearer, mas não exige token.
            try {
                await request.jwtVerify();
            } catch {
                /* sem token / token inválido: segue sem usuário autenticado */
            }
            return;
        }
        try {
            await request.jwtVerify();
        } catch {
            throw ApiError.unauthorized();
        }
    });
}, { name: 'auth' });
