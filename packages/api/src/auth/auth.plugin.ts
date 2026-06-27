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
 * Registra @fastify/jwt (AUTH_SECRET / AUTH_JWT_EXPIRES_IN) e o decorator
 * `authenticate`. ADR NOTA-ADR-1: JWT manual, não Better Auth.
 */
export const authPlugin = fp(async (app) => {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('AUTH_SECRET não definido — auth não pode iniciar.');

    await app.register(fastifyJwt, {
        secret,
        sign: { expiresIn: process.env.AUTH_JWT_EXPIRES_IN ?? '7d' },
    });

    app.decorate('authenticate', async (request: FastifyRequest) => {
        try {
            await request.jwtVerify();
        } catch {
            throw ApiError.unauthorized();
        }
    });
}, { name: 'auth' });
