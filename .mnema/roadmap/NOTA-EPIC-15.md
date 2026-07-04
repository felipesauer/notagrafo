---
mnema:
  key: NOTA-EPIC-15
  kind: epic
  state: CLOSED
  title: >-
    UX & navegação — filtros no topo, listagem com ações, continuidade, grafo
    repensado
  description: >-
    Fase 3 do redesign (após NOTA-EPIC-13 estrutural e NOTA-EPIC-14 dataviz,
    esta CONGELADA). Raiz do problema apontado pelo usuário: arquitetura de
    informação e fluxo, não decoração. Auditoria de fluxos reais (plano
    aprovado) → 4 frentes: (1) filtros da coluna esquerda para barra no topo +
    busca única (nº/chave/empresa) + chips + contagem; (2) listagem legível
    (razão social, não CNPJ cru) + menu de ações por linha; (3) continuidade de
    navegação: voltar contextual + grafo como drawer do detalhe da NF (não
    trocar de página) + deep-links bidirecionais; (4) grafo repensado: nós-card
    legíveis/tipados, arestas com peso e direção, hover isola vizinhança, layout
    que usa a área, minimap funcional. Pode alterar API (api/graph/worker)
    quando necessário — ex.: razão social no GET /nf, busca única. Dataviz
    retomada depois.
  metadata: {}
  created_at: '2026-07-03T02:43:03.130Z'
  closed_at: '2026-07-03T22:00:18.554Z'
---
# UX & navegação — filtros no topo, listagem com ações, continuidade, grafo repensado
