---
mnema:
  key: NOTA-100
  state: DONE
  title: 'Impostos: KPIs por tributo com sparkline + composição'
  description: >-
    Faixa de KPI cards por tributo (só os com valor > 0), cada um com total +
    sparkline da sua série mensal e cor própria (serieConfig). Inclui IBS/CBS/IS
    na série empilhada quando presentes (a tela já tinha barras de carga, série
    ICMS/COFINS/IPI/PIS, transição e rankings ordenáveis do redesign). e2e
    verdes.
  acceptance_criteria:
    - KPI card por tributo com sparkline + cor própria
    - Série empilhada inclui IBS/CBS/IS quando presentes
    - Reusa Sparkline + serieConfig existentes
    - tsc/lint/unit verdes
  labels:
    - area:dashboard
    - tipo:polish
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-14
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:46:30.986Z'
---
# Impostos: KPIs por tributo com sparkline + composição (donut/stacked)
