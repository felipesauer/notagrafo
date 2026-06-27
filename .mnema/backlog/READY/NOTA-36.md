---
mnema:
  key: NOTA-36
  state: READY
  title: 'Dashboard: Overview com Treemap por UF (Recharts)'
  description: >-
    O Overview (.plan/03 seção 4) pede um Treemap por UF (área proporcional ao
    volume de NFs por UF) com Recharts, não implementado. Adicionar a seção com
    dados reais de stats por UF (criar/derivar endpoint se necessário). Achado
    #5.
  acceptance_criteria:
    - Overview renderiza um Recharts Treemap com distribuição por UF
    - Os dados vêm de uma fonte real (endpoint de stats por UF)
    - Loading skeleton e erro inline tratados
    - vite build OK e app sobe
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T22:55:50.096Z'
---
# Dashboard: Overview com Treemap por UF (Recharts)
