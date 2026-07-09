---
mnema:
  key: NOTA-208
  state: IN_REVIEW
  title: 'Sec: banner de aviso forte quando AUTH_ENABLED=false em produção'
  description: >-
    AUTH_ENABLED=false abre todas as rotas protegidas. Há um app.log.warn
    discreto em auth.plugin.ts:59. Elevar: banner destacado no boot quando auth
    desligada E NODE_ENV=production. Reforçar README.
  acceptance_criteria:
    - banner destacado no boot quando auth desligada + NODE_ENV=production
    - warn normal nos demais casos
    - README explicita o risco em produção
    - teste unit do banner de produção
  labels:
    - area:api
    - dim:seguranca
  estimate: 2
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-32
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:25:28.799Z'
---
# Sec: banner de aviso forte quando AUTH_ENABLED=false em produção
