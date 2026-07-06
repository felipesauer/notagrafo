---
mnema:
  key: NOTA-145
  state: DONE
  title: SortableHead órfão removido
  description: >-
    SortableHead.tsx estava órfão (nenhum import) — removido. O hook
    useTableSort (testado, função pura) foi mantido para uso futuro.
  acceptance_criteria:
    - SortableHead removido
    - sem referência órfã
    - hook testado mantido
  labels:
    - area:dashboard
    - tipo:refactor
  estimate: 1
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-20
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T19:01:35.238Z'
---
# SortableHead órfão: usar nos rankings ou remover
