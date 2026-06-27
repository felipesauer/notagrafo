---
mnema:
  key: NOTA-10
  state: DONE
  title: Driver Neo4j e migrations (@nfp/graph)
  description: >-
    Criar packages/graph/src/migrations.ts com as constraints de unicidade e
    índices (fulltext e range) da seção 3 do 01 schema-dados.md, com IF NOT
    EXISTS (idempotente). Configurar driver/conexão Neo4j. Migrations rodam no
    boot da API e do worker.
  acceptance_criteria:
    - Constraints de empresa, nf, produto, cfop, ncm com IF NOT EXISTS
    - Índices fulltext e range criados
    - Rodar duas vezes não gera erro (idempotente)
    - Driver Neo4j via variáveis NEO4J_*
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-3
  sprint_key: NOTA-SPRINT-3
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T16:15:01.100Z'
---
# Driver Neo4j e migrations (@nfp/graph)
