---
mnema:
  key: NOTA-63
  state: IN_REVIEW
  title: >-
    Fase 4c — Dashboard: grafo enriquecido (produtos, valor nas arestas, painel
    fiscal)
  description: >-
    packages/dashboard/src/graph: (1) suportar nós de Produto via toggle
    'incluir produtos' consumindo getCompanyGraph?includeProdutos=true (Fase 2);
    (2) exibir valorTotal agregado no label das arestas (hoje só totalNFs → 'N
    NFs · R$ X'); (3) enriquecer o GraphPanel com indicador fiscal e, para
    produto, descrição/NCM/valor + navegação (NFs por NCM). Atualizar layout.ts
    (ApiGraph.produtos, ApiEdge.valorTotal), Graph.tsx (toggle), GraphPanel.tsx,
    CustomNode (cor produto) e i18n.
  acceptance_criteria:
    - >-
      Grafo passa a renderizar nós de Produto quando o toggle está ativo;
      arestas mostram 'N NFs · R$ X'
    - >-
      GraphPanel mostra ao menos um indicador fiscal para o nó selecionado e, em
      produto, navegação para itens relacionados
    - build/lint e testes verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:07:25.037Z'
---
# Fase 4c — Dashboard: grafo enriquecido (produtos, valor nas arestas, painel fiscal)
