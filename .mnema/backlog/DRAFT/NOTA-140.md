---
mnema:
  key: NOTA-140
  state: DRAFT
  title: data-testid=data-table consistente + remover wrappers overflow-x redundantes
  description: >-
    ExplorerImpostos (Top NCM/CFOP) não têm data-testid=data-table (herdam
    'chart'). Padronizar para data-table. Remover os <div overflow-x-auto>
    externos redundantes (o <Table> shadcn já embrulha em table-container com
    overflow-x-auto) em Impostos/Overview/NFDetail, OU padronizar a presença.
    (Inconsistências B e G.)
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:refactor
  estimate: 1
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-20
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T18:39:27.886Z'
---
# data-testid=data-table consistente + remover wrappers overflow-x redundantes
