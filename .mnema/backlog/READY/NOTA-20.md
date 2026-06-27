---
mnema:
  key: NOTA-20
  state: READY
  title: 'Rotas de empresa, export, stats e health'
  description: >-
    Criar empresa.routes.ts (GET /empresa/:cnpj, /empresa/:cnpj/grafo com depth
    máx 4 → 400), export.routes.ts (POST /export e GET /export/:id + /download —
    assíncrono com TTL e 410 ao expirar), stats.routes.ts (overview, volume,
    top-empresas, top-produtos) e health.routes.ts (GET /health sem auth,
    200/503). Schemas correspondentes.
  acceptance_criteria:
    - '/empresa/:cnpj e /grafo com validação de depth (400 se >4)'
    - >-
      Export assíncrono: POST cria job, GET acompanha, download serve, 410 após
      TTL
    - Todos os /stats/* conforme contrato
    - /health sem auth com status de neo4j/redis/storage e xsdVersions
  estimate: 8
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:16.824Z'
---
# Rotas de empresa, export, stats e health
