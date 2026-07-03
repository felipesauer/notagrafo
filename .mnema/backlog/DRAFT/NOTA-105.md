---
mnema:
  key: NOTA-105
  state: DRAFT
  title: 'Continuidade de navegação: voltar contextual + grafo como drawer do detalhe'
  description: >-
    Botão 'voltar' contextual nas telas de destino (usa history do router).
    Breadcrumb com o item real clicável (Notas > NF #37 > ...). GRAFO COMO
    DRAWER (Sheet lateral) abrível a partir do detalhe da NF, mantendo a NF
    visível — sem trocar de página; a página /grafo dedicada continua para
    exploração ampla. Deep-links bidirecionais: clicar num nó do grafo abre a
    entidade sem perder o grafo. e2e verdes (link 'ver no grafo' vira abertura
    de drawer — ajustar spec se preciso, mantendo cobertura).
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-15
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T02:44:28.951Z'
---
# Continuidade de navegação: voltar contextual + grafo como drawer do detalhe
