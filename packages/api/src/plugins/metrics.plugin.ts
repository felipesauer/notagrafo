import fp from 'fastify-plugin';
import { registry } from '../observability/metrics.js';

/**
 * Expõe /metrics (formato Prometheus) com as métricas nfp_* e as default.
 * Rota sem autenticação JWT — proteger via firewall/network em produção
 * (seção 4 do 04 infra-testes.md).
 */
export const metricsPlugin = fp(async (app) => {
    app.get(
        '/metrics',
        { schema: { tags: ['observability'], summary: 'Métricas Prometheus', hide: true } },
        async (_request, reply) => {
            reply.header('Content-Type', registry.contentType);
            return registry.metrics();
        },
    );
}, { name: 'metrics' });
