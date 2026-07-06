---
mnema:
  key: NOTA-133
  state: DRAFT
  title: 'UX: tabela de Itens da NF (detalhe) fora do padrão das tabelas do Explorer'
  description: >-
    Usuário: 'listagem dos itens não tem os padrões de UX do resto do sistema'.
    NFDetail.tsx tabela de Itens (linhas 163-213) não usa
    densityClass/data-sticky nem o mesmo tratamento das tabelas do Explorer
    (ExplorerNotas usa data-sticky + densityClass). Correção: alinhar a tabela
    de itens ao padrão (sticky header, densidade, alinhamentos, tipografia
    mono/tabular-nums nos números fiscais), mantendo o tfoot de totais.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 2
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:45.226Z'
---
# UX: tabela de Itens da NF (detalhe) fora do padrão das tabelas do Explorer
