import { describe, it, expect, vi } from 'vitest';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApiError, errorHandler } from './errors.js';

describe('ApiError factories (unit)', () => {
    it('mapeiam status e código corretos', () => {
        expect(ApiError.badRequest('x').statusCode).toBe(400);
        expect(ApiError.unauthorized().code).toBe('UNAUTHORIZED');
        expect(ApiError.notFound('NF_NOT_FOUND', 'x')).toMatchObject({ statusCode: 404, code: 'NF_NOT_FOUND' });
        expect(ApiError.duplicate('x').code).toBe('DUPLICATE_NF');
        expect(ApiError.invalidXml('x', ['d']).detalhes).toEqual(['d']);
        expect(ApiError.unsupportedSchema('x').code).toBe('UNSUPPORTED_SCHEMA_VERSION');
    });
});

function fakeReply() {
    const reply = {
        statusCode: 0,
        body: undefined as unknown,
        status(s: number) {
            this.statusCode = s;
            return this;
        },
        send(b: unknown) {
            this.body = b;
            return this;
        },
    };
    return reply as unknown as FastifyReply & { statusCode: number; body: { error: string; message: string; detalhes?: string[] } };
}
const fakeReq = () => ({ id: 'req-1', log: { error: vi.fn() } }) as unknown as FastifyRequest;

describe('errorHandler (unit)', () => {
    it('serializa ApiError no envelope com detalhes', () => {
        const reply = fakeReply();
        errorHandler(ApiError.invalidXml('ruim', ['linha 1']), fakeReq(), reply);
        expect(reply.statusCode).toBe(422);
        expect(reply.body).toMatchObject({ error: 'INVALID_XML', message: 'ruim', detalhes: ['linha 1'], requestId: 'req-1' });
    });

    it('erro de validação do Fastify → 400 BAD_REQUEST com detalhes', () => {
        const reply = fakeReply();
        const err = { statusCode: 400, validation: [{ instancePath: '/email', message: 'is required' }], message: 'bad' } as unknown as FastifyError;
        errorHandler(err, fakeReq(), reply);
        expect(reply.statusCode).toBe(400);
        expect(reply.body.error).toBe('BAD_REQUEST');
        expect(reply.body.detalhes).toEqual(['/email is required']);
    });

    it('429 mapeia para RATE_LIMIT_EXCEEDED', () => {
        const reply = fakeReply();
        errorHandler({ statusCode: 429, message: 'slow down' } as FastifyError, fakeReq(), reply);
        expect(reply.statusCode).toBe(429);
        expect(reply.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('500 esconde a mensagem interna e loga', () => {
        const reply = fakeReply();
        const req = fakeReq();
        errorHandler({ statusCode: 500, message: 'stack secreto' } as FastifyError, req, reply);
        expect(reply.statusCode).toBe(500);
        expect(reply.body.message).toBe('Erro interno do servidor.');
        expect(req.log.error).toHaveBeenCalled();
    });

    it('sem statusCode → 500 INTERNAL_ERROR', () => {
        const reply = fakeReply();
        errorHandler({ message: 'oops' } as FastifyError, fakeReq(), reply);
        expect(reply.statusCode).toBe(500);
        expect(reply.body.error).toBe('INTERNAL_ERROR');
    });
});
