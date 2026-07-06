---
mnema:
  key: NOTA-144
  state: DRAFT
  title: Remover tabs de entidade no desktop (manter no mobile) + ajustar e2e
  description: >-
    As tabs de entidade no topo do Explorer (Explorer.tsx:132) duplicam o rail
    no desktop. Removê-las no desktop (md+) mantendo-as no mobile (onde o rail é
    drawer). O header contextual já mostra a entidade ativa. Ajustar
    companies.spec/products.spec (que clicam getByRole button Empresas/Produtos)
    para navegar por URL (?entity=), como network.spec já faz. (Decisão do
    usuário.)
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:ux
  estimate: 2
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T18:39:14.231Z'
---
# Remover tabs de entidade no desktop (manter no mobile) + ajustar e2e
