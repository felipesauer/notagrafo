---
mnema:
  key: NOTA-30
  state: READY
  title: GitHub Actions CI e issue templates
  description: >-
    Criar .github/workflows/ci.yml conforme 04 infra-testes.md: jobs lint (lint
    + typecheck), test-unit (coverage), test-integration (Testcontainers, RYUK
    off), test-e2e (Playwright + docker compose com DEMO) e build (3 imagens,
    cache gha, sem push, só na main). Issue templates bug_report.yml e
    feature_request.yml.
  acceptance_criteria:
    - >-
      ci.yml com lint, test-unit, test-integration, test-e2e e build encadeados
      por needs
    - >-
      test-integration roda Testcontainers; test-e2e sobe docker compose com
      DEMO
    - build das 3 imagens com cache gha e sem push (só na main)
    - Issue templates bug_report.yml e feature_request.yml criados
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-7
  sprint_key: NOTA-SPRINT-7
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T23:21:19.160Z'
---
# GitHub Actions CI e issue templates
