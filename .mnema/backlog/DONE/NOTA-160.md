---
mnema:
  key: NOTA-160
  state: DONE
  title: 'Fix: tooltip do Sankey (Rede/Fluxo de valor) com texto espremido'
  description: >-
    Reportado pelo usuário (screenshot): o tooltip do diagrama de Sankey (aba
    Fluxo de valor da Rede) renderizava o texto quebrando cada palavra numa
    linha (razão social + seta + razão social empilhadas verticalmente),
    ilegível. Causa: o container do tooltip do Nivo fica estreito sem
    white-space. Corrigido com whiteSpace:nowrap no theme.tooltip.container e
    nos divs de node/link tooltip.
  acceptance_criteria:
    - Tooltip do link mostra 'Origem → Destino' numa linha só
    - Valor + NF-e em linha abaixo, sem quebra por palavra
    - lint+tsc limpos
  labels:
    - bug
    - charts
    - dashboard
    - ux
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-22
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T00:24:37.115Z'
---
# Fix: tooltip do Sankey (Rede/Fluxo de valor) com texto espremido
