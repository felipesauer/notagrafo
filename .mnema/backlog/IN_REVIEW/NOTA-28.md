---
mnema:
  key: NOTA-28
  state: IN_REVIEW
  title: Dockerfiles multi-stage (api, worker, dashboard)
  description: >-
    Criar os Dockerfiles do 04 infra-testes.md: api (deps → build → production,
    copia core/graph/api dist + schemas XSD), worker (espelho, CMD worker.js),
    dashboard (build Vite → nginx) e nginx.conf (SPA fallback + proxy /api/ para
    api:3000 + gzip).
  acceptance_criteria:
    - Dockerfile da api multi-stage com cópia dos XSDs
    - Dockerfile do worker espelho do api com CMD worker.js
    - Dockerfile do dashboard builda e serve via nginx
    - nginx.conf com SPA fallback e proxy /api/
    - Cada imagem builda sem erro
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-7
  sprint_key: NOTA-SPRINT-7
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T12:21:20.188Z'
---
# Dockerfiles multi-stage (api, worker, dashboard)
