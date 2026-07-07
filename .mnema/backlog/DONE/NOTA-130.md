---
mnema:
  key: NOTA-130
  state: DONE
  title: 'BUG: Sankey (Fluxo de valor) ilegível no dark'
  description: >-
    Causa: linkBlendMode multiply default do Nivo (preto sobre fundo escuro).
    Fix: blendMode normal + toRgb.
  acceptance_criteria:
    - Faixas do Sankey visíveis no dark
    - contraste ok no claro
  labels:
    - area:dashboard
    - area:dataviz
    - tipo:bug
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:57:19.375Z'
---
# BUG: Sankey (Fluxo de valor) ilegível no dark — faixas quase invisíveis
