---
mnema:
  key: NOTA-84
  state: DONE
  title: 'e2e: seletores estáveis com data-testid'
  description: >-
    Desacoplar os 9 specs de packages/dashboard/e2e das classes CSS que serão
    removidas no redesign. Trocar locator('.classe') por getByTestId,
    adicionando data-testid no TSX: app-sidebar, kpi-card, chart, data-table,
    nf-status-filter (select), export-format (select), export-list,
    status-badge, inline-card. Seletores por role/label/texto bilíngue
    permanecem. .react-flow (classe da lib) mantém. Zero mudança visual.
  acceptance_criteria:
    - pnpm test:e2e verde
    - Nenhum locator de classe CSS própria restante nos specs (grep)
    - >-
      Diff contém apenas atributos data-testid e ajustes de specs — zero mudança
      visual
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T21:58:36.504Z'
---
# e2e: seletores estáveis com data-testid
