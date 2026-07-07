---
mnema:
  key: NOTA-184
  state: DRAFT
  title: Persistência dos alertas disparados + endpoints (listar/marcar lido)
  description: >-
    Persistir os Alertas (nó :Alerta no Neo4j ou store) com estado
    lido/não-lido. Endpoints: GET /alertas (lista, filtro por lido/severidade),
    PATCH /alertas/:id (marcar lido), GET /alertas/count (não-lidos, para o
    badge). Testes de rota.
  acceptance_criteria:
    - Alertas persistidos com estado lido/não-lido
    - GET /alertas + PATCH marcar lido + count
    - Testes de rota
  labels:
    - alertas
    - api
    - graph
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:33:04.339Z'
---
# Persistência dos alertas disparados + endpoints (listar/marcar lido)
