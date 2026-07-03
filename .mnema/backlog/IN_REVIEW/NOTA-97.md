---
mnema:
  key: NOTA-97
  state: IN_REVIEW
  title: Code-splitting do bundle do dashboard (lazy routes + manualChunks)
  description: >-
    Resolver o aviso do Vite de chunk único >500kB (1.286 kB). Converter os
    componentes de página do router (TanStack) em lazyRouteComponent para
    route-based code-splitting: libs pesadas (Recharts, @xyflow/react,
    @dagrejs/dagre, html-to-image) carregam só nos chunks das rotas que as usam.
    Login e shell ficam no chunk inicial. Manter validateSearch de /login, /nf,
    /grafo. e2e verdes.
  acceptance_criteria:
    - Chunk inicial reduzido; Recharts/React Flow em chunks separados por rota
    - Aviso de >500kB some ou fica restrito a vendor isolado
    - validateSearch de /login //nf //grafo preservados
    - build + lint + test:unit verdes
    - suíte e2e 12/12 verde
  labels: []
  estimate: 2
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T01:30:38.423Z'
---
# Code-splitting do bundle do dashboard (lazy routes + manualChunks)
