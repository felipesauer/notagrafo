---
mnema:
  key: NOTA-102
  state: IN_REVIEW
  title: 'Polish com Framer Motion: microinterações, transições, reveal do drawer'
  description: >-
    Instalar framer-motion (motion). Microanimações COM PARCIMÔNIA (respeitando
    prefers-reduced-motion): entrada de cards em stagger nos dashboards
    (Overview/Impostos), reveal suave do GraphDrawer, transição de abertura de
    KPIs, hover microinterações. Não exagerar (motion demais = template).
    Auditar bundle. e2e verdes.
  acceptance_criteria:
    - framer-motion instalado; motion com prefers-reduced-motion respeitado
    - stagger de cards + reveal do drawer + microinterações
    - sem exagero; e2e verdes
    - bundle auditado
  labels:
    - area:dashboard
    - tipo:polish
  estimate: 3
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-14
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T16:04:47.837Z'
---
# Polish transversal: motion sutil, empty/hover states, tipografia
