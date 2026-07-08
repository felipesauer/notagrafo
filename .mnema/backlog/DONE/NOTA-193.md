---
mnema:
  key: NOTA-193
  state: DONE
  title: 'Build compartilhado: camadas por estabilidade + cache do store pnpm'
  description: >-
    Rebuild incremental era ~1m11s (recompilava core/graph/worker + pnpm deploy
    re-resolvia 660 pacotes). Fix: (1) camadas por estabilidade nos Dockerfiles
    (libs antes do pacote-folha) — mudar o app não invalida o build das libs;
    (2) cache mount do store pnpm no install e deploy — deploy caiu de 48.6s p/
    ~5s. docker-bake.hcl p/ build paralelo. Resultado: rebuild incremental 1m11s
    → 23s.
  acceptance_criteria:
    - core/graph compilados uma vez, reusados (camada CACHED)
    - rebuild incremental do app 1m11s → 23s
    - cache mount do store pnpm no install+deploy
    - build limpo OK + stack healthy + login funciona
  labels:
    - docker
    - dx
    - infra
  estimate: 3
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T15:30:03.557Z'
---
# Build compartilhado: evitar recompilar core/graph em cada imagem (bake/base comum)
