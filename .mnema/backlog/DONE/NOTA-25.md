---
mnema:
  key: NOTA-25
  state: DONE
  title: Página de Grafo (React Flow + dagre)
  description: >-
    Criar /grafo com React Flow + dagre: toolbar (busca empresa, slider depth
    1-4, filtro de direção, reset, exportar PNG), nós Empresa/NotaFiscal/Produto
    com estilos distintos e arestas com label, expansão ao clicar (GET
    /empresa/:cnpj/grafo?depth=1, sem duplicar) e GraphPanel universal. ?cnpj=
    na URL é a fonte de verdade.
  acceptance_criteria:
    - Nós Empresa/NotaFiscal/Produto com estilos distintos e arestas com label
    - Clicar expande vizinhos (depth=1) sem duplicar e abre GraphPanel
    - Slider, direção, reset e exportar PNG funcionam
    - '?cnpj= na URL é a fonte de verdade do estado inicial'
    - Layout automático via dagre
  estimate: 8
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-6
  sprint_key: NOTA-SPRINT-6
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T11:41:10.832Z'
---
# Página de Grafo (React Flow + dagre)
