---
mnema:
  key: NOTA-192
  state: DONE
  title: >-
    Dockerfiles enxutos: multi-stage com pnpm deploy --prod (runtime sem
    devDeps)
  description: >-
    Reescrever os 3 Dockerfiles (api, worker, dashboard) para runtime enxuto via
    pnpm deploy --prod. Stage build compila uma vez; runtime recebe só dist +
    node_modules de produção, sem devDeps/toolchain. Alvo api/worker ~550MB →
    <200MB. libxmljs2 nativo compilado no build. Smoke test /health + parse de
    NF.
  acceptance_criteria:
    - api e worker < 200MB (eram ~550MB)
    - runtime sem devDependencies nem python/make/g++
    - libxmljs2 funciona no runtime (parse de NF real)
    - compose up --profile app sobe healthy
  labels:
    - docker
    - dx
    - infra
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-08T14:10:44.216Z'
---
# Dockerfiles enxutos: multi-stage com pnpm deploy --prod (runtime sem devDeps)
