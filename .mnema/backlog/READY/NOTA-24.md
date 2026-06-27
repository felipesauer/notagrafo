---
mnema:
  key: NOTA-24
  state: READY
  title: 'Páginas de dados (Overview, NFs, Empresas, Produtos)'
  description: >-
    Criar Overview (KPI cards, ComposedChart volume/valor, BarChart top
    fornecedores, Treemap por UF, tabela últimas NFs), NFs (NFList com
    toolbar/filtros/tabela + UploadModal; NFDetail em duas colunas com
    mini-grafo e itens), Empresas e Produtos (tabela + card inline). Componentes
    compartilhados (NFStatusBadge, CNPJText, CurrencyValue, DateDisplay,
    UploadModal, FilterSidebar, EmptyState, LoadingSkeleton, ErrorBoundary).
  acceptance_criteria:
    - 'Overview com 4 KPIs, gráficos Recharts e tabela das últimas NFs'
    - >-
      NFList com filtros, paginação cursor-based e UploadModal com polling;
      NFDetail com itens e mini-grafo
    - Empresas e Produtos com tabela e card inline
    - Componentes compartilhados reutilizados
    - Loading via skeleton e erros inline com 'tentar novamente'
  estimate: 13
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:56:28.082Z'
---
# Páginas de dados (Overview, NFs, Empresas, Produtos)
