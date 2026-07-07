---
mnema:
  key: NOTA-157
  state: DONE
  title: 'Fix: X de fechar duplicado nos peeks (NF e Empresa)'
  description: >-
    SheetContent do shadcn injeta um X próprio no canto (showCloseButton padrão
    true). NFPeek e EmpresaPeek já tinham X customizado no header (ao lado das
    setas de navegação), gerando DOIS X. Corrigido com showCloseButton={false}
    nesses dois peeks. Reportado pelo usuário.
  acceptance_criteria:
    - Cada peek (NF/Empresa) mostra exatamente 1 botão de fechar
    - ProdutoPeek/MobileNav inalterados
    - e2e verdes
  labels:
    - bug
    - dashboard
    - ux
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-22
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T00:14:10.865Z'
---
# Fix: X de fechar duplicado nos peeks (NF e Empresa)
