---
mnema:
  key: NOTA-89
  state: IN_REVIEW
  title: >-
    Página Notas Fiscais: lista, filtros (acordeão+chips) e upload
    (Dialog+Progress)
  description: >-
    Tabela shadcn 8 colunas (ações = icon Buttons com Tooltip); busca com
    debounce 300ms (useDebouncedValue); select nativo de status estilizado
    (testid nf-status-filter — e2e usa selectOption, ADR-10); FilterSidebar →
    Accordion em grupos (Identificação/Datas/Valores/Partes/Itens fiscais) +
    chips de filtros ativos (Badge com X) + contador; UploadModal → Dialog
    shadcn (ESC/focus-trap/clique-fora) + Progress usando progresso/total do job
    + dropzone restylada + toast no sucesso; paginação com Buttons. Sem
    ordenação de coluna (ADR-9). Remove do index.css .nf-list*,
    .filter-sidebar*, .modal*, .dropzone*, .toolbar, .pagination.
  acceptance_criteria:
    - Busca com debounce 300ms
    - Chips com remoção individual e contador de filtros ativos
    - Dialog fecha com ESC/clique fora e prende o foco
    - Barra de progresso do upload usando progresso/total
    - e2e nf-list e upload verdes
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T00:40:12.112Z'
---
# Página Notas Fiscais: lista, filtros (acordeão+chips) e upload (Dialog+Progress)
