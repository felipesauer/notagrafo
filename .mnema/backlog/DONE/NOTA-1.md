---
mnema:
  key: NOTA-1
  state: DONE
  title: Setup do monorepo pnpm
  description: >-
    Criar a base do monorepo: pnpm-workspace.yaml apontando para packages/*,
    package.json raiz com os scripts (dev, dev:packages, build, test, test:unit,
    test:integration, test:e2e, test:coverage, lint, typecheck, format, demo)
    conforme o arquivo 04 infra-testes.md, e as 5 pastas de pacote (core, graph,
    api, worker, dashboard) cada uma com seu package.json nomeado @nfp/core,
    @nfp/graph, @nfp/api, @nfp/worker, @nfp/dashboard.
  acceptance_criteria:
    - pnpm-workspace.yaml lista packages/*
    - package.json raiz contém todos os scripts do 04 infra-testes.md
    - As 5 pastas de pacote existem com package.json nomeado conforme a tabela
    - pnpm install roda sem erros
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-1
  sprint_key: NOTA-SPRINT-1
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T11:53:27.722Z'
---
# Setup do monorepo pnpm
