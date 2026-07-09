---
mnema:
  key: NOTA-206
  state: DRAFT
  title: 'Perf: índices Neo4j para nf.valorTotal e nf.numero'
  description: >-
    migrations.ts não cria índice para nf.valorTotal (usado em filtro
    valorTotalMin/Max e ORDER BY de listInvoices) nem nf.numero/nf.serie (filtro
    por igualdade em listInvoices; o fulltext nf_search não serve para '=').
    Filtro/ordenação por valor e busca por número fazem scan. Adicionar RANGE
    index para nf.valorTotal e índice para nf.numero. Nota: nf.finalidade não é
    indexável de forma útil (função+negação no predicado), então fica de fora —
    documentar. Validar com EXPLAIN/PROFILE que o índice é usado.
  acceptance_criteria:
    - RANGE index em nf.valorTotal e índice em nf.numero criados nas migrations
    - PROFILE/EXPLAIN mostra uso do índice no filtro/order correspondente
    - migrations idempotentes (IF NOT EXISTS)
    - suíte de integração continua verde
  labels:
    - area:graph
    - dim:performance
  estimate: 2
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:13.126Z'
---
# Perf: índices Neo4j para nf.valorTotal e nf.numero
