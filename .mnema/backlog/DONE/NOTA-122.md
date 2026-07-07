---
mnema:
  key: NOTA-122
  state: DONE
  title: 'Fase 4 — Grafo/Rede: anti-hairball + cores novas'
  description: >-
    Aplicar princípios anti-hairball (Cambridge Intelligence) ao grafo ego
    (Graph.tsx/React Flow) e à rede completa (Network.tsx/RedeGraph.tsx/Reagraph
    WebGL): filtros por tipo de nó, tamanho de nó por métrica
    (centralidade/totalNFs), limite de nós on-screen, legenda de cor por tipo.
    Cores WebGL via resolveTokenColorsRGB (paleta nova, já compatível desde a
    Fase 0) e minimap hex já atualizado. Manter WebGL (rede grande) vs SVG (ego
    close-up). Preservar comportamento dos specs graph/network.
  acceptance_criteria:
    - grafo/rede com filtro por tipo de nó + limite de nós on-screen
    - >-
      nós dimensionados por métrica (centralidade/totalNFs) e coloridos por tipo
      com legenda
    - cores WebGL corretas (resolveTokenColorsRGB), sem nós pretos
    - graph.spec e network.spec verdes
    - typecheck/lint verdes
  labels:
    - dashboard
    - graph
    - reagraph
    - redesign
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:56:57.299Z'
---
# Fase 4 — Grafo/Rede: anti-hairball + cores novas
