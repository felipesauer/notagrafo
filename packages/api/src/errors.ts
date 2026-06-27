import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/** Envelope de erro padrão da API (seção 8 do 02 contratos api.md). */
export interface ErrorEnvelope {
    error: string;
    message: string;
    detalhes?: string[];
    requestId: string;
}

/** Erro de domínio da API com código e status HTTP mapeados. */
export class ApiError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly detalhes?: string[];

    constructor(statusCode: number, code: string, message: string, detalhes?: string[]) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        if (detalhes) this.detalhes = detalhes;
    }

    static badRequest(message: string, detalhes?: string[]): ApiError {
        return new ApiError(400, 'BAD_REQUEST', message, detalhes);
    }
    static unauthorized(message = 'Token ausente ou inválido.'): ApiError {
        return new ApiError(401, 'UNAUTHORIZED', message);
    }
    static notFound(code: string, message: string): ApiError {
        return new ApiError(404, code, message);
    }
    static duplicate(message: string, detalhes?: string[]): ApiError {
        return new ApiError(409, 'DUPLICATE_NF', message, detalhes);
    }
    static invalidXml(message: string, detalhes?: string[]): ApiError {
        return new ApiError(422, 'INVALID_XML', message, detalhes);
    }
    static unsupportedSchema(message: string): ApiError {
        return new ApiError(422, 'UNSUPPORTED_SCHEMA_VERSION', message);
    }
}

/** Mapeia o statusCode do Fastify (validação/rate-limit) para um código padrão. */
function codeForStatus(status: number): string {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 429:
            return 'RATE_LIMIT_EXCEEDED';
        case 503:
            return 'SERVICE_UNAVAILABLE';
        default:
            return 'INTERNAL_ERROR';
    }
}

/** Error handler global: serializa qualquer erro no envelope padrão. */
export function errorHandler(
    err: FastifyError | ApiError,
    request: FastifyRequest,
    reply: FastifyReply,
): void {
    const requestId = request.id;

    if (err instanceof ApiError) {
        const body: ErrorEnvelope = {
            error: err.code,
            message: err.message,
            requestId,
            ...(err.detalhes ? { detalhes: err.detalhes } : {}),
        };
        reply.status(err.statusCode).send(body);
        return;
    }

    // Erros de validação de schema do Fastify → 400 BAD_REQUEST
    const status = err.statusCode ?? 500;
    const code = status === 400 && err.validation ? 'BAD_REQUEST' : codeForStatus(status);
    const body: ErrorEnvelope = {
        error: code,
        message: status >= 500 ? 'Erro interno do servidor.' : err.message,
        requestId,
        ...(err.validation ? { detalhes: err.validation.map((v) => `${v.instancePath} ${v.message}`) } : {}),
    };

    if (status >= 500) request.log.error({ err }, 'erro não tratado');
    reply.status(status).send(body);
}
