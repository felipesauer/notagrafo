import type { FastifyServerOptions } from 'fastify';
import { maskCpf } from '@notagrafo/core';

/** Caminhos comuns onde um documento (cnpj/CPF de MEI) pode aparecer nos logs. */
const CPF_REDACT_PATHS = [
    'cnpj',
    '*.cnpj',
    '*.*.cnpj',
    'emitente.cnpj',
    'destinatario.cnpj',
    'cnpjEmitente',
    'cnpjDestinatario',
    '*.cnpjEmitente',
    '*.cnpjDestinatario',
];

/**
 * Config do logger Pino (já embutido no Fastify):
 *  - development → pino-pretty (legível no terminal), nível debug
 *  - production  → JSON puro, nível info
 * Todo log inclui requestId/method/url/statusCode/responseTime (via Fastify).
 *
 * Quando `LGPD_MASK_CPF=true`, valores em campos de documento que sejam CPF
 * (11 dígitos, MEI) são pseudonimizados via `redact` do Pino; CNPJs de 14
 * dígitos passam intactos (não são dado pessoal).
 */
export function loggerConfig(env: NodeJS.ProcessEnv = process.env): FastifyServerOptions['logger'] {
    const isProd = env.NODE_ENV === 'production';
    const maskCpfEnabled = env.LGPD_MASK_CPF === 'true';
    return {
        level: isProd ? 'info' : 'debug',
        ...(maskCpfEnabled
            ? {
                  redact: {
                      paths: CPF_REDACT_PATHS,
                      // censor recebe o valor original; só mascara se for CPF.
                      censor: (value: unknown) => (typeof value === 'string' ? maskCpf(value) : value),
                  },
              }
            : {}),
        ...(isProd
            ? {}
            : {
                  transport: {
                      target: 'pino-pretty',
                      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                  },
              }),
    };
}
