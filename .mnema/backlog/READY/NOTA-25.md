---
mnema:
  key: NOTA-25
  state: READY
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
    - 'Slider, direção, reset e exportar PNG funcionam'
    - '?cnpj= na URL é a fonte de verdade do estado inicial'
    - Layout automático via dagre
  estimate: 8
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:35.517Z'
---
# Página de Grafo (React Flow + dagre)
