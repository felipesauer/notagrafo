---
mnema:
  key: NOTA-196
  state: DONE
  title: 'BUG: aba ''rede completa'' não renderiza o grafo (Reagraph/WebGL)'
  description: >-
    A aba abre mas não exibe nada, embora /stats/network retorne 5 nós/16
    arestas válidos. Investigar no navegador (console/WebGL): container altura
    zero? WebGL/erro do Reagraph? Corrigir. Adicionar loading/erro/empty
    visíveis (hoje não há).
  acceptance_criteria:
    - Grafo da rede completa renderiza os nós/arestas do seed
    - Causa raiz identificada e corrigida
    - Loading/erro/empty visíveis na aba
    - Verificado no navegador
  labels:
    - bug
    - dashboard
    - grafo
    - reagraph
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T00:01:44.178Z'
---
# BUG: aba 'rede completa' não renderiza o grafo (Reagraph/WebGL)
