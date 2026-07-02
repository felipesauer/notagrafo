---
mnema:
  key: NOTA-ADR-11
  kind: decision
  status: proposed
  title: Código gerado pelo shadcn CLI fica como gerado (alias @/, sem extensão .js)
  context: >-
    O monorepo usa ESM com imports relativos com extensão .js. O shadcn CLI gera
    imports por alias; com moduleResolution Bundler + alias no Vite, extensão é
    dispensável nesses caminhos.
  decision: >-
    Arquivos em src/components/ui/** (gerados pelo shadcn CLI) mantêm o formato
    do gerador: imports via alias @/ e sem extensão .js. A convenção de extensão
    .js explícita do repo continua valendo para imports RELATIVOS do código
    próprio.
  rationale: >-
    Não editar código gerado facilita re-sync/diff com upstream do shadcn. O
    typecheck (tsc --noEmit) valida ambos os estilos.
  consequences: >-
    ESLint não deve exigir extensão em imports por alias. Atualizações de
    componentes shadcn podem ser reaplicadas via CLI sem conflito de estilo.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/ui/
    - packages/dashboard/components.json
    - NOTA-85
  metadata: {}
  at: '2026-07-02T19:30:00.347Z'
---
# Código gerado pelo shadcn CLI fica como gerado (alias @/, sem extensão .js)
