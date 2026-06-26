---
mnema:
  key: NOTA-16
  state: READY
  title: Boot Fastify e plugins base (@nfp/api)
  description: >-
    Criar server.ts (boot Fastify, registro de plugins e rotas),
    request-id.plugin.ts (UUID por requisição via @fastify/request-context),
    swagger.plugin.ts (OpenAPI 3.1 + Swagger UI em /docs) e rate-limit.plugin.ts
    (@fastify/rate-limit com Redis). Prefixo /api/v1. Envelope de erro padrão
    (seção 8 do 02 contratos-api.md).
  acceptance_criteria:
    - Fastify sobe na PORT com prefixo /api/v1
    - /docs serve Swagger UI com OpenAPI 3.1
    - requestId por requisição em logs e erros
    - Rate limit com store Redis
    - 'Envelope de erro padrão (error, message, detalhes, requestId)'
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:56.440Z'
---
# Boot Fastify e plugins base (@nfp/api)
