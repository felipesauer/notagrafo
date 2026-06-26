---
mnema:
  key: NOTA-5
  state: DONE
  title: Tipos TypeScript do schema (@nfp/core)
  description: >-
    Criar packages/core/src/types/nf.types.ts exatamente como a seção 5 do 01
    schema-dados.md: enums (NFStatus, NFTipo, NFFinalidade, RegimeTributario,
    EventoTipo) e interfaces (NotaFiscalNode, EmpresaNode, ProdutoNode, NCMNode,
    CFOPNode, RawDataNode, EventoNode, ContemEdge, CancelaEdge, DevolveEdge).
    Não duplicar tipos.
  acceptance_criteria:
    - nf.types.ts exporta todos os enums e interfaces da seção 5
    - Campos opcionais marcados com ?
    - Sem any explícito
    - pnpm typecheck verde em @nfp/core
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-2
  sprint_key: NOTA-SPRINT-2
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T15:27:39.997Z'
---
# Tipos TypeScript do schema (@nfp/core)
