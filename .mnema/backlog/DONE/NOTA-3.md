---
mnema:
  key: NOTA-3
  state: DONE
  title: ESLint e EditorConfig
  description: >-
    Criar .eslintrc.js exatamente como no 04 infra-testes.md (no-explicit-any:
    error, no-console: warn permitindo warn/error, no-unused-vars com
    argsIgnorePattern ^_, override em testes) e .editorconfig (4 espaços em
    .ts/.tsx, 2 em json/yml/yaml). Não sobrescrever indentação via prettier.
  acceptance_criteria:
    - .eslintrc.js idêntico ao 04 infra-testes.md
    - .editorconfig com 4 espaços para .ts/.tsx e 2 para json/yml
    - pnpm lint roda sem erros na estrutura vazia
    - no-explicit-any como error fora de testes
  estimate: 1
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-1
  sprint_key: NOTA-SPRINT-1
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T15:17:07.190Z'
---
# ESLint e EditorConfig
