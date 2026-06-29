---
mnema:
  key: NOTA-52
  state: DONE
  title: Renomear identificadores PT→EN no pacote @notagrafo/api
  description: >-
    Padronizar para inglês os identificadores de LÓGICA DE CÓDIGO do pacote
    `packages/api`, mantendo intacto o CONTRATO JSON da API (nomes de campos no
    body/resposta e rotas) definido em `.plan/`.


    Renomear (exemplos da varredura):

    - auth/user.repository.ts: `buscarPorEmail`→`findByEmail`,
    `buscarPorId`→`findById`, `criarUsuario`→`createUser`,
    `verificarSenha`→`verifyPassword`; tipos `Usuario`→`User`,
    `UsuarioComHash`→`UserWithHash` (cuidado: o label Neo4j `:Usuario` e as
    propriedades `nome`/`senhaHash`/`criadoEm` nas queries Cypher NÃO mudam).

    - nf/audit.hook.ts: `registrarConsulta`→`recordQuery`/`auditQuery`.

    - routes: `empresaRoutes`→`companyRoutes` (empresa.routes.ts); demais
    funções de rota já estão em inglês (`statsRoutes`, `healthRoutes`,
    `authRoutes`, `exportRoutes`, `nfRoutes`) — manter.

    - Renomear arquivo `empresa.routes.ts`→`company.routes.ts`;
    `nf.routes.ts`/`nf.schemas.ts` mantêm a sigla NF.

    - Variáveis locais e parâmetros em PT dentro de handlers/serviços → inglês.


    NÃO MEXER: paths de rota (`/empresa/:cnpj/...`, `/nf`, `/stats/...`) e nomes
    de campos no JSON de request/response — são o contrato público da API
    (.plan/ + testes e2e do dashboard). Labels/propriedades Neo4j dentro das
    queries Cypher permanecem.


    Depende de NOTA-50 (core) e NOTA-51 (graph): a api importa
    `validarNFe`/`getEmpresaGrafo`/`topProdutos`/etc.; aguardar os renames
    upstream e ajustar imports. Atualizar testes unit e de integração da api.
  acceptance_criteria:
    - >-
      Funções PT da api renomeadas para inglês (buscarPorEmail, buscarPorId,
      criarUsuario, verificarSenha, registrarConsulta, empresaRoutes)
    - Tipos PT da api renomeados (Usuario→User, UsuarioComHash→UserWithHash)
    - >-
      Arquivo empresa.routes.ts renomeado para company.routes.ts com imports
      atualizados
    - >-
      Paths de rota e nomes de campos do JSON de request/response permanecem
      idênticos (contrato público preservado); labels/propriedades Neo4j nas
      queries Cypher inalterados
    - >-
      Imports de símbolos renomeados do core/graph atualizados; pnpm
      build/typecheck/lint passam; test:unit e test:integration da api verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-10
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T15:21:01.319Z'
---
# Renomear identificadores PT→EN no pacote @notagrafo/api
