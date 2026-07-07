---
mnema:
  key: NOTA-187
  state: DRAFT
  title: 'ADR + spike: GDS vs Cypher puro/APOC para métricas de grafo'
  description: >-
    Decidir a abordagem antes de implementar centralidade/comunidades. Verificar
    se o Neo4j Community (imagem atual do compose) suporta o plugin GDS, ou se
    fica em APOC/Cypher puro/cálculo no app. Spike: testar PageRank/Louvain via
    GDS num container; se inviável, definir fallback (centralidade por grau em
    Cypher; comunidades por componente conexo/vizinhança). Registrar ADR com a
    escolha e o impacto no compose. Bloqueia as tasks seguintes do epic.
  acceptance_criteria:
    - Confirma suporte (ou não) a GDS no Neo4j Community do compose
    - ADR registrando a abordagem escolhida + fallback
    - Decisão desbloqueia as tasks de centralidade/comunidades
  labels:
    - adr
    - graph
    - neo4j
    - spike
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:33:45.163Z'
---
# ADR + spike: GDS vs Cypher puro/APOC para métricas de grafo
