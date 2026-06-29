---
mnema:
  key: NOTA-54
  state: DONE
  title: Renomear identificadores PT→EN no pacote @notagrafo/dashboard
  description: >-
    Padronizar para inglês os identificadores de LÓGICA DE CÓDIGO do pacote
    `packages/dashboard` (hooks, componentes, páginas, vars), mantendo as
    strings de UI (i18n pt-BR/en) e os nomes de campos do payload da API.


    Renomear (exemplos da varredura):

    - Hooks: `useTopEmpresas`→`useTopCompanies`, `usePorUf`→`useByUf`,
    `useEmpresa`→`useCompany`, `useTopProdutos`→`useTopProducts`,
    `useHistoricoPreco`→`usePriceHistory` (api/hooks.ts).

    - Componentes/funções React: `NoCustom`→`CustomNode` (grafo/NoCustom.tsx +
    arquivo), `GrafoInterno`→`GraphInner`, `GrafoPage`→`GraphPage`
    (pages/Grafo.tsx), `EmpresaCard`→`CompanyCard`,
    `EmpresasPage`→`CompaniesPage` (pages/Empresas.tsx),
    `ProdutosPage`→`ProductsPage`, `HistoricoPrecoChart`→`PriceHistoryChart`
    (pages/Produtos.tsx), `GraphPanel` já em inglês.

    - Tipos auxiliares de UI: `TipoNo`→`NodeType`, `DadosNo`→`NodeData`,
    `NoGrafo`→`GraphNode`.

    - Funções/vars locais: `aplicarLayout`→`applyLayout` (grafo/layout.ts),
    `iniciais`→`initials`, `carregar`→`load`, `mesclar`→`merge`,
    `buscar`→`search`, `exportarPng`→`exportPng`, `dados`→`data`,
    `serie`→`series`, `estilo`→`style`, `grau`→`degree`,
    `ranking`/`topEmpresas`/`porUf` (vars derivadas) → inglês.

    - Renomear arquivos: pasta `grafo/`→`graph/` (NoCustom.tsx→CustomNode.tsx,
    layout.ts, GraphPanel.tsx), `pages/Grafo.tsx`→`pages/Graph.tsx`,
    `pages/Empresas.tsx`→`pages/Companies.tsx`,
    `pages/Produtos.tsx`→`pages/Products.tsx`. Ajustar imports e o roteamento
    (TanStack Router) — cuidado para não alterar os PATHS de rota visíveis ao
    usuário, só os nomes de arquivo/símbolo.


    NÃO MEXER: strings de texto exibidas ao usuário (ficam no i18n pt-BR; manter
    paridade com en); nomes de campos lidos do payload da API (ex.:
    `chaveAcesso`, `valorTotal`, `cnpjEmitente` no array `CAMPOS` de
    Exportacoes.tsx, `ranking`, `historico` etc. — são o contrato da API); paths
    de rota e o search param `cnpj`. A const `CAMPOS` lista nomes de campos do
    contrato — manter os valores; só renomear a variável se quiser (`FIELDS`).


    Depende de NOTA-52 (api) se o contrato de campos mudasse — mas como o
    contrato é preservado, pode rodar em paralelo; ainda assim marcar relates_to
    com api. Atualizar specs e2e (Playwright) que referenciem nomes de
    arquivo/rota se necessário, mantendo asserts de UI.
  acceptance_criteria:
    - >-
      Hooks renomeados para inglês (useTopEmpresas→useTopCompanies, usePorUf,
      useEmpresa, useTopProdutos, useHistoricoPreco)
    - >-
      Componentes e páginas renomeados (NoCustom→CustomNode,
      GrafoInterno/GrafoPage, EmpresaCard/EmpresasPage, ProdutosPage,
      HistoricoPrecoChart) e tipos de UI (TipoNo/DadosNo/NoGrafo)
    - >-
      Funções/variáveis locais em PT renomeadas (aplicarLayout, iniciais,
      carregar, mesclar, buscar, exportarPng, dados, serie, estilo, grau)
    - >-
      Arquivos/pasta renomeados (grafo/→graph/,
      Grafo.tsx/Empresas.tsx/Produtos.tsx) com imports e registro de rotas
      atualizados, SEM alterar os paths de rota visíveis nem o search param cnpj
    - >-
      Strings de UI (i18n pt-BR/en com paridade) e nomes de campos do payload da
      API permanecem inalterados; pnpm build/typecheck/lint passam; testes do
      dashboard e specs e2e verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-10
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T15:21:33.971Z'
---
# Renomear identificadores PT→EN no pacote @notagrafo/dashboard
