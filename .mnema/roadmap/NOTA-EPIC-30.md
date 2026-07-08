---
mnema:
  key: NOTA-EPIC-30
  kind: epic
  state: OPEN
  title: Melhorias de Exportação e Grafo (UX + formatos + bug da rede)
  description: >-
    Pedidos do usuário + melhorias de UX/API sugeridas. Frentes: (1) BUG: aba
    'rede completa' (Reagraph/WebGL) abre mas não renderiza nada, apesar de
    /stats/network retornar dados válidos (5 nós/16 arestas confirmado) —
    investigar no navegador (WebGL indisponível? dimensão zero do container?
    erro de runtime do Reagraph?) + adicionar loading/erro/empty visíveis (hoje
    não há, por isso 'não exibe nada' é ambíguo). (2) Export UX: mover o form da
    coluna esquerda (grid 320px_1fr) para o topo (horizontal), histórico
    embaixo; agrupar melhor os ~30 checkboxes de campos. (3) Incluir XMLs
    originais num ZIP: opção no export de empacotar os XMLs originais das NF-e
    (do storage MinIO) junto com CSV/XLSX/JSON — backend novo (buscar XMLs +
    zipar). (4) Exportar grafo em JSON com relações: botão na tela do grafo
    (Graph.tsx/GraphPanel) para baixar nós+arestas em JSON, e como formato/tipo
    novo no export em lote. Decisões do usuário: incluir=XMLs em ZIP; executar
    como epic em PRs pequenos por ordem de risco (bug→export→grafo). Stack:
    dashboard React (Exports.tsx, Network.tsx, RedeGraph.tsx reagraph, Graph.tsx
    react-flow); API export.service + /export; storage MinIO; grafo via
    /stats/network e /empresa/:cnpj/graph.
  metadata: {}
  created_at: '2026-07-08T21:45:49.551Z'
  closed_at: null
---
# Melhorias de Exportação e Grafo (UX + formatos + bug da rede)
