---
mnema:
  key: NOTA-ADR-10
  kind: decision
  status: proposed
  title: >-
    Selects nativos estilizados nos pontos manipulados pelos e2e via
    selectOption
  context: >-
    Os specs Playwright usam page.selectOption(), que exige `<select>` nativo —
    Radix Select renderiza listbox custom e quebraria os testes. Estética
    clean/densa favorece controles compactos.
  decision: >-
    Os selects de status (NFList), formato (Exportações) e direção (Grafo)
    permanecem elementos `<select>` nativos, estilizados com Tailwind, em vez de
    Radix Select do shadcn.
  rationale: >-
    Preserva os e2e sem reescrever interação; select nativo é acessível de graça
    e mais denso. Radix Select só se surgir necessidade de render custom
    (nenhuma hoje).
  consequences: >-
    Manter um estilo de select nativo consistente com os Input/Trigger do shadcn
    (classe compartilhada).
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/e2e/
    - NOTA-89
    - NOTA-93
    - NOTA-94
  metadata: {}
  at: '2026-07-02T19:29:55.021Z'
---
# Selects nativos estilizados nos pontos manipulados pelos e2e via selectOption
