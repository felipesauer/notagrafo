---
mnema:
  key: NOTA-126
  state: DONE
  title: >-
    BUG: crash da Rede completa no dev (Vite 8 corrompe método import() do
    graphology)
  description: >-
    Crash /explorar?entity=rede no dev por bug do import-analysis do Vite 8.
    Fix: bump Vite 8.1.3 (verificado com node --check). Só dev; produção OK.
  acceptance_criteria:
    - Rede completa abre no dev sem SyntaxError
    - reagraph servido passa node --check
    - e2e rede verde
  labels:
    - area:dashboard
    - sev:alta
    - tipo:bug
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T20:57:11.123Z'
---
# BUG: crash da Rede completa no dev (Vite 8 corrompe método import() do graphology)
