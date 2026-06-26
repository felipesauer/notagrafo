---
mnema:
  key: NOTA-2
  state: READY
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:54:58.555Z'
---
# TypeScript base do monorepo
