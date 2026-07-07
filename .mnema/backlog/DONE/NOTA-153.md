---
mnema:
  key: NOTA-153
  state: DONE
  title: Insights só na Home (Visão Geral); demais telas ocupam largura total
  description: >-
    O InsightsPanel renderiza em TODAS as rotas hoje (ruído em
    Grafo/Config/Exports/Explorer). Tornado exclusivo da Home (pathname '/').
    Nas demais, a área de conteúdo ocupa a largura toda (respeitando o max-width
    do enquadramento). Implementado no AppShell via isHome && insightsOpen.
  acceptance_criteria:
    - InsightsPanel aparece só em / (Visão Geral)
    - Explorer/Grafo/Config/Exports sem o painel lateral de insights
    - Sem layout shift/coluna vazia nas telas sem insights
  labels:
    - dashboard
    - layout
    - ux
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T00:13:52.784Z'
---
# Insights só na Home (Visão Geral); demais telas ocupam largura total
