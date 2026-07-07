---
mnema:
  key: NOTA-179
  state: DRAFT
  title: 'Drill-down temporal: clicar no gráfico de volume abre as NF do período'
  description: >-
    No gráfico de volume/valor da Overview (Recharts), clicar num ponto/barra
    (mês/dia) navega para /explore?entity=notas com dataEmissaoInicio/Fim
    daquele período. Reusa o filtro de data já existente no /nf. Cursor de
    clique + handler onClick do Recharts.
  acceptance_criteria:
    - Clique num período do gráfico leva ao Explorer filtrado por data
    - Deep-link linkável (search params)
    - Funciona nas 3 granularidades (dia/semana/mês)
  labels:
    - analise
    - bi
    - dashboard
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T16:32:24.079Z'
---
# Drill-down temporal: clicar no gráfico de volume abre as NF do período
