---
mnema:
  key: NOTA-12
  state: IN_REVIEW
  title: Queries de grafo (empresa, nf, produto)
  description: >-
    Criar queries/empresa.queries.ts (grafo por CNPJ com depth/direction,
    stats), nf.queries.ts (listagem com filtros do GET /nf, detalhe com itens,
    paginação cursor-based via bookmark) e produto.queries.ts (por NCM,
    histórico de preço médio). Suportam os endpoints do 02 contratos-api.md.
  acceptance_criteria:
    - empresa.queries.ts retorna vizinhos com depth (máx 4)/direction e stats
    - nf.queries.ts suporta todos os filtros do GET /nf e paginação cursor-based
    - produto.queries.ts retorna ranking por NCM e histórico de preço
    - Queries testadas contra Neo4j local
  estimate: 5
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-3
  sprint_key: NOTA-SPRINT-3
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T16:35:10.883Z'
---
# Queries de grafo (empresa, nf, produto)
