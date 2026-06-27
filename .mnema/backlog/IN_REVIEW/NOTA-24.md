---
mnema:
  key: NOTA-24
  state: IN_REVIEW
  title: Páginas de dados (Overview, NFs, Empresas, Produtos)
  description: >-
    Criar Overview (KPI cards, ComposedChart volume/valor, BarChart top
    fornecedores, Treemap por UF, tabela últimas NFs), NFs (NFList com
    toolbar/filtros/tabela + UploadModal; NFDetail em duas colunas com
    mini-grafo e itens), Empresas e Produtos (tabela + card inline). Componentes
    compartilhados (NFStatusBadge, CNPJText, CurrencyValue, DateDisplay,
    UploadModal, FilterSidebar, EmptyState, LoadingSkeleton, ErrorBoundary).
  acceptance_criteria:
    - Overview com 4 KPIs, gráficos Recharts e tabela das últimas NFs
    - >-
      NFList com filtros, paginação cursor-based e UploadModal com polling;
      NFDetail com itens e mini-grafo
    - Empresas e Produtos com tabela e card inline
    - Componentes compartilhados reutilizados
    - Loading via skeleton e erros inline com 'tentar novamente'
  estimate: 13
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-6
  sprint_key: NOTA-SPRINT-6
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-27T05:30:31.616Z'
---
# Páginas de dados (Overview, NFs, Empresas, Produtos)
