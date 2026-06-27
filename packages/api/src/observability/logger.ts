import type { FastifyServerOptions } from 'fastify';

/**
 * Config do logger Pino (já embutido no Fastify):
 *  - development → pino-pretty (legível no terminal), nível debug
 *  - production  → JSON puro, nível info
 * Todo log inclui requestId/method/url/statusCode/responseTime (via Fastify).
 */
export function loggerConfig(env: NodeJS.ProcessEnv = process.env): FastifyServerOptions['logger'] {
    const isProd = env.NODE_ENV === 'production';
    return {
        level: isProd ? 'info' : 'debug',
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
