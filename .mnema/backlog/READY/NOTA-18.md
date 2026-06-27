---
mnema:
  key: NOTA-18
  state: READY
  title: 'Observabilidade da API (telemetry, logger, metrics)'
  description: >-
    Criar telemetry.ts (OTel SDK antes do Fastify, exporter via OTEL_EXPORTER,
    instrumentações fastify/http/neo4j/ioredis e spans
    nf.parse/nf.validate/nf.graph.merge/job.process/export.generate),
    logger.plugin.ts (Pino estruturado; pretty em dev, JSON em prod) e
    metrics.plugin.ts (fastify-metrics + prom-client expondo /metrics com
    nfp_*).
  acceptance_criteria:
    - >-
      telemetry.ts inicializa OTel antes do Fastify com exporter por
      OTEL_EXPORTER
    - Logs Pino estruturados; pretty em dev e JSON em prod
    - /metrics expõe métricas nfp_*
    - Spans customizados criados nos pontos do 04 infra-testes.md
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:05.518Z'
---
# Observabilidade da API (telemetry, logger, metrics)
