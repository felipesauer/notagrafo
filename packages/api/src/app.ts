import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyHelmet } from '@fastify/helmet';
import { fastifyMultipart } from '@fastify/multipart';
import type { Plugin } from 'ajv';
import ajvFormatsModule from 'ajv-formats';

// ajv-formats é CJS: o namespace importado expõe a função como `.default` (interop).
// O cast normaliza para o Plugin<unknown> que o `ajv.plugins` do Fastify espera.
const mod = ajvFormatsModule as unknown as Plugin<unknown> & { default?: Plugin<unknown> };
const ajvFormats: Plugin<unknown> = typeof mod.default === 'function' ? mod.default : mod;
import type { Driver } from 'neo4j-driver';
import type { Redis } from 'ioredis';
import type { Queue } from 'bullmq';
import type { ProcessNFeJobData, XmlStorage } from '@notagrafo/worker';
import { errorHandler, ApiError } from './errors.js';
import { requestIdPlugin, genReqId } from './plugins/request-id.plugin.js';
import { swaggerPlugin } from './plugins/swagger.plugin.js';
import { rateLimitPlugin } from './plugins/rate-limit.plugin.js';
import { authPlugin } from './auth/auth.plugin.js';
import { authRoutes } from './auth/auth.routes.js';
import { metricsPlugin } from './plugins/metrics.plugin.js';
import { loggerConfig } from './observability/logger.js';
import { nfRoutes } from './nf/nf.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { companyRoutes } from './routes/company.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { alertRoutes } from './routes/alert.routes.js';
import { exportRoutes } from './export/export.routes.js';
import { ExportService } from './export/export.service.js';

export interface BuildAppOptions {
    /** Desabilita rate-limit (útil em testes que não querem Redis para isso). */
    rateLimit?: boolean;
    logger?: boolean;
    /** Driver Neo4j — habilita as rotas de auth/nf/empresa/stats/export quando presente. */
    driver?: Driver;
    /** Fila BullMQ — habilita as rotas de NF (upload/jobs) quando presente. */
    queue?: Queue<ProcessNFeJobData>;
    /** Storage de XML — para GET /nf/:chave/xml e /health. */
    storage?: XmlStorage;
    /** Conexão Redis — para GET /health. */
    redis?: Redis;
}

/** Prefixo de versão de todas as rotas de negócio. */
export const API_PREFIX = '/api/v1';

/**
 * Monta a instância Fastify com os plugins base, error handler padrão e o
 * prefixo /api/v1. As rotas de negócio são registradas nas tasks seguintes.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
    const app: FastifyInstance = Fastify({
        genReqId,
        logger: opts.logger ? loggerConfig() : false,
        // ajv-formats habilita `format: 'email'` etc. (Fastify 5 não registra por
        // padrão). Necessário para a validação de e-mail em /auth/* (NOTA-205).
        ajv: { customOptions: { allErrors: true }, plugins: [ajvFormats] },
    });

    app.setErrorHandler(errorHandler);

    // Plugins base
    await app.register(requestIdPlugin);
    // Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
    // CSP desligado: a API serve o Swagger-UI em /docs, cujos assets inline
    // quebrariam sob uma CSP estrita — os demais headers seguem aplicados (NOTA-205).
    await app.register(fastifyHelmet, { contentSecurityPolicy: false });
    await app.register(swaggerPlugin);
    await app.register(metricsPlugin);
    if (opts.rateLimit !== false) {
        await app.register(rateLimitPlugin);
    }

    // 404 no envelope padrão
    app.setNotFoundHandler((request, reply) => {
        errorHandler(
            new ApiError(404, 'NOT_FOUND', `Rota ${request.method} ${request.url} não encontrada.`),
            request,
            reply,
        );
    });

    // Auth (JWT manual — ADR NOTA-ADR-1) quando há driver Neo4j.
    if (opts.driver) {
        await app.register(authPlugin);
        await app.register(fastifyMultipart, { limits: { fileSize: 50 * 1024 * 1024 } });
    }

    // GET /health — SEM auth e FORA do prefixo (usado por Docker/orquestradores).
    if (opts.driver && opts.redis && opts.storage) {
        await healthRoutes(app, { driver: opts.driver, redis: opts.redis, storage: opts.storage });
    }

    const exportService = opts.driver
        ? new ExportService(opts.driver, Number(process.env.EXPORT_TTL_HOURS ?? '24'), opts.redis, opts.storage)
        : undefined;

    // Rotas sob o prefixo /api/v1.
    await app.register(
        async (api) => {
            api.get('/ping', { schema: { tags: ['health'], summary: 'Ping', response: { 200: { type: 'object', properties: { pong: { type: 'boolean' } } } } } }, async () => ({ pong: true }));
            if (opts.driver) {
                await authRoutes(api, opts.driver);
                await companyRoutes(api, opts.driver);
                await statsRoutes(api, opts.driver);
                await alertRoutes(api, opts.driver);
                if (exportService) await exportRoutes(api, exportService);
                if (opts.queue && opts.storage) {
                    await nfRoutes(api, { driver: opts.driver, queue: opts.queue, storage: opts.storage });
                }
            }
        },
        { prefix: API_PREFIX },
    );

    return app;
}
