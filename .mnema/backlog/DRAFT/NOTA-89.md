---
mnema:
  key: NOTA-89
  state: DRAFT
  title: >-
    Página Notas Fiscais: lista, filtros (acordeão+chips) e upload
    (Dialog+Progress)
  description: >-
    Maior página: tabela 8 colunas (ações = icon Buttons com Tooltip); busca com
    debounce 300ms; select nativo de status estilizado (testid nf-status-filter
    preservado — e2e usa selectOption); FilterSidebar → Accordion em grupos
    (Identificação/Datas/Valores/Partes/Itens fiscais) + chips de filtros ativos
    (Badge com X, remoção individual) + contador no cabeçalho; UploadModal →
    Dialog shadcn (ESC/focus-trap/clique-fora) + Progress usando progresso/total
    do polling do job + dropzone restylada + toast no sucesso; paginação com
    Buttons. Sem ordenação de coluna (API pagina por cursor sem sort — decisão
    D3, documentar como trabalho futuro). Remover do index.css as classes
    .nf-list*, .filter-sidebar*, .modal*, .dropzone*.
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
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T19:28:48.144Z'
---
# Página Notas Fiscais: lista, filtros (acordeão+chips) e upload (Dialog+Progress)
