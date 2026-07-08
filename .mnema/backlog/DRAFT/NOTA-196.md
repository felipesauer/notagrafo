---
mnema:
  key: NOTA-196
  state: DRAFT
  title: 'BUG: aba ''rede completa'' não renderiza o grafo (Reagraph/WebGL)'
  description: >-
    A aba abre mas não exibe nada, embora /stats/network retorne 5 nós/16
    arestas válidos. Investigar no navegador (console/WebGL): container com
    altura zero? WebGL indisponível/erro do Reagraph? GraphCanvas sem dimensão?
    Corrigir a causa. Adicionar estados visíveis: loading enquanto busca, erro
    com retry, empty quando de fato vazio — hoje não há, por isso 'não exibe
    nada' é ambíguo.
  acceptance_criteria: []
  labels: []
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T21:46:12.846Z'
---
# BUG: aba 'rede completa' não renderiza o grafo (Reagraph/WebGL)
