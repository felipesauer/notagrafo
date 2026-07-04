---
mnema:
  key: NOTA-122
  state: DRAFT
  title: 'Fase 4 — Grafo/Rede: anti-hairball + cores novas'
  description: >-
    Aplicar princípios anti-hairball (Cambridge Intelligence) ao grafo ego
    (Graph.tsx / React Flow) e à rede completa (Network.tsx / RedeGraph.tsx /
    Reagraph): filtros por tipo de nó, tamanho de nó por centralidade, limite de
    nós on-screen (≤ ~centenas), legenda de cor por tipo, progressive
    disclosure. Cores WebGL via resolveTokenColorsRGB (paleta nova) e minimap
    hex já atualizado na Fase 0. Manter a divisão WebGL (rede grande) vs SVG
    (ego close-up). Preservar comportamento dos specs graph/network.
  acceptance_criteria:
    - >-
      grafo não renderiza a base inteira: filtros por tipo de nó + limite de nós
      on-screen
    - nós dimensionados por centralidade e coloridos por tipo com legenda
    - cores WebGL corretas (via resolveTokenColorsRGB), sem nós pretos
    - graph.spec e network.spec verdes
    - typecheck/lint verdes
  labels:
    - dashboard
    - graph
    - reagraph
    - redesign
  estimate: 5
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:48.095Z'
---
# Fase 4 — Grafo/Rede: anti-hairball + cores novas
