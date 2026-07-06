---
mnema:
  key: NOTA-129
  state: IN_REVIEW
  title: 'BUG: card Sistema (health) não carrega no dev'
  description: 'fetch(''/health'') sem proxy no Vite. Fix: proxy /health + tolera 503.'
  acceptance_criteria:
    - Card Sistema carrega no dev
    - proxy /health no vite.config
  labels:
    - area:dashboard
    - tipo:bug
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:47:00.914Z'
---
# BUG: card Sistema (health) não carrega no dev — proxy /health ausente no Vite
