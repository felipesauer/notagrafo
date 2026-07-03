---
mnema:
  key: NOTA-106
  state: IN_REVIEW
  title: >-
    Grafo repensado: nós-card, arestas com peso/direção, hover-isola, layout,
    minimap
  description: >-
    Substituir nós-círculo por nós-card legíveis (razão social + UF/tipo +
    métrica; cor+ícone por tipo empresa/NF/produto) via lib oficial
    ui.reactflow.dev (Base Node). Arestas com espessura proporcional ao volume +
    SETA de direção; rótulo sem sobrepor. HOVER isola a vizinhança (esmaece o
    resto) — conta a história de quem transaciona com quem. Corrigir PROPORÇÃO
    do layout (dagre) para usar a área toda. Consertar MINIMAP (hoje
    vazio/quebrado). Legenda coerente. colorMode ligado ao tema. Pode ajustar
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
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T14:50:19.039Z'
---
# Grafo repensado: nós-card, arestas com peso/direção, hover-isola, layout, minimap
