---
mnema:
  key: NOTA-189
  state: DONE
  title: Detecção de comunidades (clusters de empresas) + cor no grafo
  description: >-
    Comunidades por componente conexo (union-find in-app) sobre a rede
    empresa↔empresa (ADR-20). API GET /stats/communities. Dashboard: colorir nós
    por comunidade no RedeGraph (toggle UF/comunidade) + legenda + resumo.
    Testes.
  acceptance_criteria:
    - Comunidades detectadas (componentes conexos)
    - Grafo colore por comunidade + legenda
    - Resumo de comunidades
    - Testes
  labels:
    - dashboard
    - grafo
    - graph
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-28
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:21:20.321Z'
---
# Detecção de comunidades (clusters de empresas) + cor no grafo
