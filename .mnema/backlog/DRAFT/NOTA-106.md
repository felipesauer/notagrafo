---
mnema:
  key: NOTA-106
  state: DRAFT
  title: >-
    Grafo repensado: nós-card, arestas com peso/direção, hover-isola, layout,
    minimap
  description: >-
    Substituir nós-círculo por nós-card legíveis (razão social + UF/tipo +
    métrica; cor+ícone por tipo empresa/NF/produto) — usar a lib oficial
    ui.reactflow.dev (Base Node) da NOTA-101 congelada. Arestas com espessura
    proporcional ao volume e SETA de direção; rótulo sem sobrepor. HOVER isola a
    vizinhança (esmaece o resto) — conta a história de quem transaciona com
    quem. Corrigir a PROPORÇÃO do layout (dagre) para usar a área toda (hoje
    espremido à direita). Consertar o MINIMAP (hoje vazio/quebrado). Legenda
    coerente com o que é exibido. colorMode ligado ao tema. Pode ajustar
    getCompanyGraph na API se faltar peso/direção. e2e graph verde.
  acceptance_criteria:
    - nós-card legíveis e tipados (não círculos)
    - arestas com peso + direção; hover isola vizinhança
    - layout usa a área toda; minimap funcional
    - e2e graph verde
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 8
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T02:44:31.171Z'
---
# Grafo repensado: nós-card, arestas com peso/direção, hover-isola, layout, minimap
