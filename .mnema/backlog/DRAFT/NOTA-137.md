---
mnema:
  key: NOTA-137
  state: DRAFT
  title: 'UX: alinhamento/espaço morto da Home (bento grid)'
  description: >-
    Usuário: 'falta de alinhamento na home' (setas apontam espaços vazios abaixo
    dos KPIs COMPANIES/PRODUCTS e entre donut/Top suppliers/Distribution).
    Overview.tsx usa grid sm:grid-cols-12 com cards de alturas diferentes; os
    KPIs sem sparkline (Empresas/Produtos) ficam curtos deixando vazio, e as
    linhas do bento não alinham as bordas inferiores. Correção: equalizar
    alturas (itens-stretch/h-full nos cards), dar conteúdo/altura consistente
    aos KPIs sem spark (ex.: mini-hint ou barra), e revisar a distribuição de
    colunas para as bordas baterem. Validar nos dois temas e em larguras md/lg.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 2
  priority: 4
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:21.167Z'
---
# UX: alinhamento/espaço morto da Home (bento grid)
