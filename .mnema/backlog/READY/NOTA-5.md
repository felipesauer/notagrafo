---
mnema:
  key: NOTA-5
  state: READY
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:10.031Z'
---
# Tipos TypeScript do schema (@nfp/core)
