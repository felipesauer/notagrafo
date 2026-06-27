---
mnema:
  key: NOTA-28
  state: READY
  title: 'Dockerfiles multi-stage (api, worker, dashboard)'
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:43.080Z'
---
# Dockerfiles multi-stage (api, worker, dashboard)
