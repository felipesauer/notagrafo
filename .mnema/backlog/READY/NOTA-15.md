---
mnema:
  key: NOTA-15
  state: READY
  title: Seed de demo de NFes fictícias
  description: >-
    Criar o seed de demo: com DEMO=true gera DEMO_NF_COUNT NFes fictícias
    válidas contra o XSD e as processa pelo pipeline normal, populando o grafo.
    Usado pelo serviço seed do profile demo. Permite o quickstart de 5 minutos
    com grafo navegável.
  acceptance_criteria:
    - DEMO=true gera DEMO_NF_COUNT NFes fictícias e popula o grafo
    - XMLs gerados passam na validação XSD
    - 'Seed roda uma vez e encerra (restart: no)'
    - 'Após o seed, GET /stats/overview retorna números coerentes'
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:53.878Z'
---
# Seed de demo de NFes fictícias
