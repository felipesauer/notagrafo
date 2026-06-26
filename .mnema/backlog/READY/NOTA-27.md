---
mnema:
  key: NOTA-27
  state: READY
  title: Testes e2e do dashboard (Playwright)
  description: >-
    Criar playwright.config.ts (baseURL http://localhost:8080, webServer com
    docker compose --profile app) e os specs: auth.spec.ts, upload.spec.ts
    (upload + polling), nf-list.spec.ts (filtros + paginação + detalhe),
    grafo.spec.ts (busca empresa + expansão), export.spec.ts (criar exportação +
    banner).
  acceptance_criteria:
    - playwright.config.ts com baseURL e webServer conforme 04 infra-testes.md
    - Specs auth, upload, nf-list, grafo e export implementados
    - pnpm test:e2e verde contra o docker compose
    - Screenshots/trace em falha configurados
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-6
  sprint_key: NOTA-SPRINT-6
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T23:21:09.409Z'
---
# Testes e2e do dashboard (Playwright)
