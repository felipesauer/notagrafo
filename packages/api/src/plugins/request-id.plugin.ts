import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';
import { fastifyRequestContext } from '@fastify/request-context';

declare module '@fastify/request-context' {
    interface RequestContextData {
        requestId: string;
    }
}

/**
 * Gera um UUID por requisição (request.id) e o disponibiliza no request-context
 * para logs e respostas de erro (regra 2 da seção 9 do 02 contratos api.md).
 */
export const requestIdPlugin = fp(async (app) => {
    await app.register(fastifyRequestContext);

    app.addHook('onRequest', async (request) => {
        app.requestContext.set('requestId', request.id);
    });
}, { name: 'request-id' });

/** Gerador de request id usado na config do Fastify. */
export function genReqId(): string {
    return randomUUID();
}
