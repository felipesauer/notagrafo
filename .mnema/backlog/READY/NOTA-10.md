---
mnema:
  key: NOTA-10
  state: READY
  title: Driver Neo4j e migrations (@nfp/graph)
  description: >-
    Criar packages/graph/src/migrations.ts com as constraints de unicidade e
    índices (fulltext e range) da seção 3 do 01 schema-dados.md, com IF NOT
    EXISTS (idempotente). Configurar driver/conexão Neo4j. Migrations rodam no
    boot da API e do worker.
  acceptance_criteria:
    - 'Constraints de empresa, nf, produto, cfop, ncm com IF NOT EXISTS'
    - Índices fulltext e range criados
    - Rodar duas vezes não gera erro (idempotente)
    - Driver Neo4j via variáveis NEO4J_*
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:29.087Z'
---
# Driver Neo4j e migrations (@nfp/graph)
