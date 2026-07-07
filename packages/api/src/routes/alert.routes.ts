import type { FastifyInstance } from 'fastify';
import type { Driver } from 'neo4j-driver';
import {
    evaluateAlerts,
    syncAlerts,
    listAlerts,
    countUnreadAlerts,
    markAlertRead,
    markAllAlertsRead,
    getAlertConfig,
    saveAlertConfig,
    type AlertConfig,
    type AlertSeverity,
} from '@notagrafo/graph';

/**
 * Alert routes (EPIC-27). On-demand evaluation (ADR-19): POST /alerts/evaluate
 * runs the rule engine with the global config and upserts the results. The
 * dashboard's notification center reads /alerts and /alerts/count. Generic path
 * segments in English; fiscal domain stays in PT elsewhere.
 */
export async function alertRoutes(app: FastifyInstance, driver: Driver): Promise<void> {
    // POST /alerts/evaluate — runs the rules and persists the alerts.
    app.post(
        '/alerts/evaluate',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['alerts'],
                summary: 'Avalia as regras de alerta e persiste os alertas disparados',
                security: [{ bearerAuth: [] }],
            },
        },
        async () => {
            const config = await getAlertConfig(driver);
            const alerts = await evaluateAlerts(driver, config);
            const total = await syncAlerts(driver, alerts, new Date().toISOString());
            return { evaluated: alerts.length, stored: total };
        },
    );

    // GET /alerts — lista os alertas (filtro por lido/severidade).
    app.get<{ Querystring: { read?: string; severity?: AlertSeverity; limit?: number } }>(
        '/alerts',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['alerts'],
                summary: 'Lista alertas, mais severos e recentes primeiro',
                querystring: {
                    type: 'object',
                    properties: {
                        read: { type: 'string', enum: ['true', 'false'] },
                        severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                        limit: { type: 'integer', minimum: 1, maximum: 500 },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => {
            const { read, severity, limit } = request.query;
            const alerts = await listAlerts(driver, {
                read: read === undefined ? undefined : read === 'true',
                severity,
                limit: limit ? Number(limit) : 100,
            });
            return { alerts };
        },
    );

    // GET /alerts/count — total de não-lidos (para o badge do sino).
    app.get(
        '/alerts/count',
        {
            preHandler: app.authenticate,
            schema: { tags: ['alerts'], summary: 'Total de alertas não-lidos', security: [{ bearerAuth: [] }] },
        },
        async () => ({ unread: await countUnreadAlerts(driver) }),
    );

    // POST /alerts/read-all — marca todos como lidos.
    app.post(
        '/alerts/read-all',
        {
            preHandler: app.authenticate,
            schema: { tags: ['alerts'], summary: 'Marca todos os alertas como lidos', security: [{ bearerAuth: [] }] },
        },
        async () => ({ updated: await markAllAlertsRead(driver) }),
    );

    // PATCH /alerts/:id — marca um alerta como lido/não-lido.
    app.patch<{ Params: { id: string }; Body: { read?: boolean } }>(
        '/alerts/:id',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['alerts'],
                summary: 'Marca um alerta como lido/não-lido',
                params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
                body: { type: 'object', properties: { read: { type: 'boolean' } } },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const read = request.body?.read ?? true;
            const ok = await markAlertRead(driver, request.params.id, read);
            if (!ok) return reply.code(404).send({ error: 'ALERT_NOT_FOUND' });
            return { id: request.params.id, read };
        },
    );

    // GET /alerts/config — configuração global das regras.
    app.get(
        '/alerts/config',
        {
            preHandler: app.authenticate,
            schema: { tags: ['alerts'], summary: 'Configuração global das regras de alerta', security: [{ bearerAuth: [] }] },
        },
        async () => ({ config: await getAlertConfig(driver) }),
    );

    // PUT /alerts/config — atualiza a configuração global (merge sobre os defaults).
    // Body validado: cada regra aceita apenas enabled (bool) e threshold (número
    // >= 0). Rejeita limiar de tipo errado ou negativo (400) — os vetores reais de
    // corrupção; o Fastify remove chaves desconhecidas, então o merge preserva os
    // defaults e a regra nunca fica com um limiar inválido.
    const ruleSchema = (withThreshold: boolean) => ({
        type: 'object',
        additionalProperties: false,
        properties: {
            enabled: { type: 'boolean' },
            ...(withThreshold ? { threshold: { type: 'number', minimum: 0 } } : {}),
        },
    });
    app.put<{ Body: Partial<AlertConfig> }>(
        '/alerts/config',
        {
            preHandler: app.authenticate,
            schema: {
                tags: ['alerts'],
                summary: 'Atualiza a configuração global das regras de alerta',
                body: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        highValue: ruleSchema(true),
                        supplierConcentration: ruleSchema(true),
                        volumeSpike: ruleSchema(true),
                        zeroTax: ruleSchema(false),
                        duplicate: ruleSchema(false),
                        numberingGap: ruleSchema(false),
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        async (request) => ({ config: await saveAlertConfig(driver, request.body ?? {}) }),
    );
}
