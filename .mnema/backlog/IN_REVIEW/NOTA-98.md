---
mnema:
  key: NOTA-98
  state: IN_REVIEW
  title: 'Fundação de dataviz: chart block shadcn + Sparkline + tokens de série'
  description: >-
    Reverter NOTA-ADR-8: adotar o chart block do shadcn. Refatorar
    ChartCard/ChartTooltip sobre ChartContainer + ChartConfig (paleta por série
    via var(--color-KEY)). Criar Sparkline (mini AreaChart com gradiente) e
    DeltaBadge (up/down %). Helper de gradiente de área reutilizável. Tokens
    --chart-* revistos (âmbar + 6 hues). Sem mudar páginas ainda. e2e verdes.
  acceptance_criteria:
    - chart block do shadcn instalado; ChartContainer/ChartConfig em uso
    - Sparkline e DeltaBadge criados e tipados
    - gradiente de área reutilizável (defs/linearGradient)
    - build/lint/test:unit/e2e verdes
  labels:
    - area:dashboard
    - tipo:polish
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-14
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T02:10:04.569Z'
---
# Fundação de dataviz: chart block shadcn + Sparkline + tokens de série
