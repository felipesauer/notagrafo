---
mnema:
  key: NOTA-130
  state: DRAFT
  title: 'BUG: Sankey (Fluxo de valor) ilegível no dark — faixas quase invisíveis'
  description: >-
    Usuário: 'Rede para dark mode não dá para ver nada'. Confirmado visualmente:
    na aba Fluxo de valor, os nós (barras) aparecem coloridos mas as FAIXAS
    (links) ficam escuríssimas, quase pretas sobre fundo escuro. Causa provável:
    FluxoSankey.tsx usa resolveTokenColors() (oklch cru, SEM conversão RGB —
    resolveTheme.ts) para nodeColor, + enableLinkGradient + linkOpacity 0.45; o
    gradiente do Nivo não interpola bem as cores oklch no dark, resultando em
    faixas escuras. Correção: usar cores convertidas (toRgb) para os nós do
    Sankey (como o RedeGraph faz com resolveTokenColorsRGB), e/ou aumentar
    linkOpacity e revisar o gradiente no dark. Validar visualmente nos dois
    temas. (A Rede completa/WebGL já converte via resolveTokenColorsRGB e está
    OK.)
  acceptance_criteria: []
  labels:
    - area:dashboard
    - area:dataviz
    - tipo:bug
  estimate: 2
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:38.844Z'
---
# BUG: Sankey (Fluxo de valor) ilegível no dark — faixas quase invisíveis
