---
mnema:
  key: NOTA-2
  state: DONE
  title: TypeScript base do monorepo
  description: >-
    Criar tsconfig.json base na raiz com strict: true e tsconfig.build.json com
    paths de pacote (@nfp/*). Cada pacote estende a base. Imports entre pacotes
    usam caminhos de pacote (@nfp/core); dentro do pacote, relativos.
  acceptance_criteria:
    - 'tsconfig.json raiz com strict: true'
    - tsconfig.build.json com paths @nfp/* para build de produção
    - Cada pacote tem tsconfig que estende a base
    - pnpm typecheck roda sem erros na estrutura vazia
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-1
  sprint_key: NOTA-SPRINT-1
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T11:58:51.777Z'
---
# TypeScript base do monorepo
