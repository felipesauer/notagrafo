---
mnema:
  key: NOTA-37
  state: DONE
  title: 'Dashboard: FilterSidebar com os filtros do GET /nf'
  description: >-
    A NFList tem só 2 filtros (status + busca); o .plan/03 seção 4 pede um
    FilterSidebar com os ~13 filtros do GET /nf (datas, valor min/max, cfop,
    ncm, finalidade, tipoNF, cnpj/uf emit/dest). Criar o componente reutilizável
    e ligar à NFList mantendo a paginação cursor. Achado #6.
  acceptance_criteria:
    - Componente FilterSidebar com os filtros do contrato GET /nf
    - >-
      NFList usa o FilterSidebar e envia os filtros à API; reset de paginação ao
      filtrar
    - Filtros refletidos na query e na listagem
    - vite build/typecheck/lint verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:42:02.545Z'
---
# Dashboard: FilterSidebar com os filtros do GET /nf
