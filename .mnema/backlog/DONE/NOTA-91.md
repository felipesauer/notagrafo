---
mnema:
  key: NOTA-91
  state: DONE
  title: 'Páginas Empresas e Produtos: expansão acessível + ordenação'
  description: >-
    Expansão de linha acessível: botão chevron com aria-expanded na primeira
    célula + conteúdo em tr/td colSpan, mantendo clique na linha (companies.spec
    clica no tr). Ordenação client-side nas colunas numéricas (useTableSort com
    aria-sort). inline-card do detalhe vira grid de mini-stats (testid
    preservado). Products: PriceHistoryChart tokenizado (ChartCard). Deep-links
    para /nf e /grafo. Tabela shadcn, PageHeader. Remove .inline-card do
    index.css.
  acceptance_criteria:
    - Expansão operável por teclado com aria-expanded
    - Colunas numéricas ordenáveis com aria-sort
    - PriceHistoryChart com tokens
    - e2e companies e products verdes
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:58:53.074Z'
---
# Páginas Empresas e Produtos: expansão acessível + ordenação
