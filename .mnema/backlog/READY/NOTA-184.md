---
mnema:
  key: NOTA-184
  state: READY
  title: Persistência dos alertas disparados + endpoints (listar/marcar lido)
  description: >-
    Persistir Alertas como nós :Alert no Neo4j com upsert por fingerprint
    (preserva lido/não-lido ao reavaliar) + config global :AlertConfig
    singleton. Endpoints: POST /alerts/evaluate, GET /alerts, GET /alerts/count,
    PATCH /alerts/:id, POST /alerts/read-all, GET/PUT /alerts/config. Testes de
    rota.
  acceptance_criteria:
    - Alertas persistidos com estado lido/não-lido (upsert por fingerprint)
    - Endpoints listar/count/marcar-lido/evaluate/config
    - Config global persistida
    - Testes de rota
  labels:
    - alertas
    - api
    - graph
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-27
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T18:45:01.377Z'
---
# Persistência dos alertas disparados + endpoints (listar/marcar lido)
