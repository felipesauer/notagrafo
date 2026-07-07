---
mnema:
  key: NOTA-187
  state: DONE
  title: 'ADR + spike: GDS vs Cypher puro/APOC para métricas de grafo'
  description: >-
    Spike confirmou GDS ausente no neo4j:5-community (só APOC 5.26). ADR-20
    registra: Cypher puro, centralidade por grau, comunidades por componente
    conexo (WCC). Sem peso no compose. Desbloqueia 188..191.
  acceptance_criteria:
    - Confirma suporte a GDS (ausente) no Neo4j Community
    - ADR-20 registrando abordagem + fallback
    - Desbloqueia centralidade/comunidades
  labels:
    - adr
    - graph
    - neo4j
    - spike
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-28
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:21:15.670Z'
---
# ADR + spike: GDS vs Cypher puro/APOC para métricas de grafo
