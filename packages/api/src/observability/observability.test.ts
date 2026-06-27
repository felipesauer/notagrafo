import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { loggerConfig } from './logger.js';
import { startTelemetry, stopTelemetry, withSpan } from './telemetry.js';
import { nfProcessedTotal } from './metrics.js';

let app: FastifyInstance | undefined;
afterEach(async () => {
    await app?.close();
    app = undefined;
    await stopTelemetry();
});

describe('/metrics', () => {
    it('expõe as métricas nfp_* no formato Prometheus', async () => {
        nfProcessedTotal.inc({ status: 'ok' });
        app = await buildApp({ rateLimit: false });
        const res = await app.inject({ method: 'GET', url: '/metrics' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.body).toContain('nfp_nf_processed_total');
        expect(res.body).toContain('nfp_queue_depth');
        expect(res.body).toContain('nfp_neo4j_query_duration_seconds');
    });
});

describe('loggerConfig', () => {
    it('usa pino-pretty em development', () => {
        const cfg = loggerConfig({ NODE_ENV: 'development' }) as { level: string; transport?: unknown };
        expect(cfg.level).toBe('debug');
        expect(cfg.transport).toBeDefined();
    });

    it('usa JSON puro (sem transport) em production', () => {
        const cfg = loggerConfig({ NODE_ENV: 'production' }) as { level: string; transport?: unknown };
        expect(cfg.level).toBe('info');
        expect(cfg.transport).toBeUndefined();
    });
});

describe('telemetry', () => {
    it('OTEL_EXPORTER=none → desabilitado', () => {
        expect(startTelemetry({ OTEL_EXPORTER: 'none' })).toBe(false);
    });

    it('OTEL_EXPORTER=console → habilitado', () => {
        expect(startTelemetry({ OTEL_EXPORTER: 'console' })).toBe(true);
    });

    it('withSpan executa a função e propaga o resultado', async () => {
        const r = await withSpan('nf.parse', async () => 42);
        expect(r).toBe(42);
    });

    it('withSpan re-lança erros', async () => {
        await expect(
            withSpan('nf.validate', async () => {
                throw new Error('falha');
            }),
        ).rejects.toThrow('falha');
    });
});
