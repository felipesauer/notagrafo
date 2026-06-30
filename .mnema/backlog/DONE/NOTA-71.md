---
mnema:
  key: NOTA-71
  state: DONE
  title: >-
    Estabilizar suíte e2e: heading ambíguo (companies/products) + healthcheck
    flaky da API no boot
  description: >-
    Dívida da auditoria 2026-06-30 (obs 019f19ea). A suíte e2e oscila no CI por
    dois motivos alheios ao código de produção: (1) HEADING AMBÍGUO em
    companies.spec.ts:8 e products.spec.ts:8 — getByRole('heading',{name}) casa
    com o h1 breadcrumb (Header.tsx:22) e o h2 da página
    (Companies.tsx:33/Products.tsx:52) → strict mode violation; fix: {level:2}.
    (2) HEALTHCHECK FLAKY — docker compose --wait falha com 'api unhealthy'
    porque o healthcheck da api não tem start_period e conta tentativas enquanto
    espera o Neo4j subir (~30s); fix: adicionar start_period. overview/nf-detail
    specs não colidem (usam h3 de seção).
  acceptance_criteria:
    - >-
      companies.spec.ts e products.spec.ts usam seletor de heading não-ambíguo
      (level:2)
    - Healthcheck da api no docker-compose.yml tem start_period adequado
    - Suíte e2e passa no CI de forma estável (sem re-run)
    - typecheck/lint/unit verdes
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-7
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:43:20.200Z'
---
# Estabilizar suíte e2e: heading ambíguo (companies/products) + healthcheck flaky da API no boot
