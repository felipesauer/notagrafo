---
mnema:
  key: NOTA-145
  state: READY
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-20
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T18:59:02.228Z'
---
# SortableHead órfão: usar nos rankings ou remover
