---
mnema:
  key: NOTA-147
  state: DRAFT
  title: Rankings (Empresas/Produtos/Impostos) com ordenação + paginação client-side
  description: >-
    Aplicar DataTable+useTableSort nas tabelas de ranking: ExplorerEmpresas,
    ExplorerProdutos, ExplorerImpostos (Top NCM + Top CFOP). Ordenação por
    coluna client-side; paginação client-side (seletor de page size). Subir o
    limit hardcoded dos hooks useTopCompanies (10) e useTopProducts (20) para um
    teto maior (ex.: 100) para a ordenação valer sobre um universo maior.
    Remover os slice(0,8) do Impostos (a paginação assume).
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-21
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T20:04:54.769Z'
---
# Rankings (Empresas/Produtos/Impostos) com ordenação + paginação client-side
