---
mnema:
  key: NOTA-105
  state: IN_REVIEW
  title: 'Continuidade de navegação: voltar contextual + grafo como drawer do detalhe'
  description: >-
    Botão 'voltar' contextual (history do router) nas telas de destino.
    Breadcrumb com item real. GRAFO COMO DRAWER (Sheet) abrível a partir do
    detalhe da NF, mantendo a NF visível — sem trocar de página; a página /grafo
    continua para exploração ampla. Deep-links bidirecionais: clicar num nó abre
    a entidade sem perder o grafo. Reusa mergeGraph/CustomNode/WeightedEdge da
    NOTA-106. e2e verdes (link 'ver no grafo' preservado ou vira abertura de
    drawer, ajustar spec mantendo cobertura).
  acceptance_criteria:
    - voltar contextual + breadcrumb com item clicável
    - grafo abre como drawer/Sheet a partir do detalhe (NF permanece)
    - deep-links bidirecionais grafo<->entidade
    - e2e verdes
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T15:03:34.000Z'
---
# Continuidade de navegação: voltar contextual + grafo como drawer do detalhe
