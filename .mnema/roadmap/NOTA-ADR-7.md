---
mnema:
  key: NOTA-ADR-7
  kind: decision
  status: proposed
  title: >-
    Dark mode via @custom-variant sobre [data-theme='escuro'], preservando
    theme.store
  context: >-
    O redesign (NOTA-EPIC-13) adota Tailwind v4 + shadcn/ui, cujo padrão de dark
    mode é a classe `.dark` no html. O app já tem tema claro/escuro funcionando
    via atributo data-theme com persistência e detecção de prefers-color-scheme.
  decision: >-
    O Tailwind v4 usará `@custom-variant dark (&:where([data-theme='escuro'],
    [data-theme='escuro'] *));` e o bloco de overrides dark do shadcn será
    declarado em `[data-theme='escuro'] { … }` em vez de `.dark`. O
    theme.store.ts (Zustand, chave localStorage nfp_tema, valores
    'claro'/'escuro' aplicados em document.documentElement.dataset.theme)
    permanece intacto.
  rationale: >-
    Zero mudança de lógica, persistência e testes: migrar o store para `.dark`
    tocaria store, Header e convenção PT do domínio sem nenhum ganho funcional.
    O custom variant do Tailwind v4 resolve todos os utilitários `dark:` com uma
    linha de CSS.
  consequences: >-
    Todos os utilitários dark: do Tailwind e os tokens do shadcn respondem ao
    data-theme existente. Quem adicionar componentes shadcn novos precisa
    converter blocos `.dark` gerados para `[data-theme='escuro']`.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/styles/globals.css
    - packages/dashboard/src/stores/theme.store.ts
    - NOTA-85
  metadata: {}
  at: '2026-07-02T19:29:36.607Z'
---
# Dark mode via @custom-variant sobre [data-theme='escuro'], preservando theme.store
