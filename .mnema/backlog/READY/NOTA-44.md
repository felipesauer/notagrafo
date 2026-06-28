---
mnema:
  key: NOTA-44
  state: READY
  title: Cobrir todos os filtros do GET /nf em testes
  description: >-
    Achado F (BAIXA): ~10 dos 16 filtros (valorTotalMin/Max, dataEmissao*,
    dataSaida*, cfop, cnpjDestinatario, ufDestinatario, tipoNF, finalidade,
    naturezaOp) não têm teste. Adicionar testes (graph e/ou api) provando
    inclusive a coerção string->number na query.
  acceptance_criteria:
    - Teste exercita valorTotalMin/Max via query (coercao string->number)
    - >-
      Teste cobre filtros de data, cfop, ufDestinatario, tipoNF, finalidade,
      naturezaOp
    - Assercoes confirmam o subconjunto filtrado
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-28T22:07:27.918Z'
---
# Cobrir todos os filtros do GET /nf em testes
