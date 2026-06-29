---
title: "Convenção: identificadores de código em inglês; domínio NF-e/contrato/Neo4j permanecem em PT (NOTA-EPIC-10 EXECUTADO)"
topics: ["convention","code-style","i18n","naming","refactor"]
created_at: 2026-06-29T02:23:20.255Z
updated_at: 2026-06-29T14:39:58.435Z
---
Convenção de idioma do código (definida com o Felipe em 2026-06-28; NOTA-EPIC-10 EXECUTADO em 2026-06-29 na branch feat/code-i18n-en, 5 commits a36e81e/a72bcb6/95ff3b7/7f2b3c3/7fadb8b).

REGRA: identificadores de LÓGICA DE CÓDIGO em INGLÊS — funções/métodos, variáveis locais/parâmetros, hooks/componentes React, tipos/interfaces auxiliares, nomes de arquivos `.ts/.tsx`.

EXCEÇÃO — mantém-se em PT (espelha SEFAZ/NFe, é contrato/schema; NÃO traduzir):
- Campos do modelo de domínio NF-e (`chaveAcesso`, `razaoSocial`, `valorTotal`, `cnpjEmitente`, `dataEmissao`...).
- Labels/propriedades Neo4j nas queries Cypher (`:Usuario`, `:NotaFiscal`, `:Empresa`, `senhaHash`, etc.) — interface TS `Usuario` virou `User`, mas o LABEL `:Usuario` ficou.
- Enums de status e valores (`'ativa'|'cancelada'`, `'entrada'|'saida'`).
- Tags do XML da NFe, XSDs, sentinela `SEM_GTIN`, `jobId=chaveAcesso` (dedup BullMQ), credenciais demo.
- **Campos de RESPOSTA da API** consumidos pelo dashboard: no graph, os tipos `EmpresaGrafo/EmpresaStats/ProdutoRanking` e seus campos (`nos`, `arestas`, `relacao`, `grau`, `porUf`, `ranking`, `meta.filtrosAtivos`) ficaram — só os NOMES DAS FUNÇÕES mudaram (getCompanyGraph, topProducts, activeFilters...). No dashboard, `ApiGrafo`→`ApiGraph` (nome do tipo) mas os campos `nos/arestas` ficaram.
- **Estado persistido no Redis** (ExportJob e seus campos) — métodos do ExportService viraram create/get/read, mas os campos serializados ficaram.
- Paths de rota/URL: API (`/empresa/:cnpj/...`) e dashboard (`/empresas`, `/produtos`, `/grafo`, `/exportacoes`, `/configuracoes`) — ficaram em PT (contrato de URL visível). Search param `cnpj` idem.
- Strings de UI nos locales i18n pt-BR/en (valores). Só a CHAVE `grafo.exportarPng`→`grafo.exportPng` foi alinhada (consistente nos 2 locales + JSX).

RENOMES PRINCIPAIS APLICADOS:
- core: validarNFe→validateNFe, parseEmpresa→parseCompany, resolveIdUnico→resolveUniqueId; produto.utils.ts→product.utils.ts.
- graph: mergeNotaFiscal→mergeInvoice, count/list/getNotaFiscal→count/list/getInvoice, filtrosAtivos→activeFilters, getEmpresaGrafo/Stats→getCompanyGraph/Stats, topProdutos→topProducts, historicoPrecoProduto→productPriceHistory; empresa/produto.queries.ts→company/product.queries.ts; tipos →InvoiceToPersist/ItemToPersist.
- api: buscarPorEmail/Id→findByEmail/findById, criarUsuario→createUser, verificarSenha→verifyPassword, Usuario→User, registrarConsulta→recordQuery, empresaRoutes→companyRoutes; empresa.routes.ts→company.routes.ts; ExportService.create/get/read.
- worker: gerarChave→generateAccessKey, gerarNFe→generateNFe, NFeGerada→GeneratedNFe, criarUsuarioDemo→createDemoUser.
- dashboard: hooks useTop*/usePorUf/useEmpresa/useHistoricoPreco→EN; NoCustom→CustomNode, Grafo/Empresas/Produtos/Exportacoes/ConfiguracoesPage→EN; tipos TipoNo/DadosNo/NoGrafo→NodeType/NodeData/GraphNode; mesclarGrafo→mergeGraph; arquivos pages/* e pasta grafo/→graph/.

ESCOPO NÃO COBERTO (decisão de baixo valor/alto ruído): props de componentes UI compartilhados (`valor`/`label`/`linhas` em shared.tsx), nomes de variáveis de rota no router (`empresasRoute`), comentários em PT. Bugs de typecheck PRÉ-EXISTENTES em test files de integração (api/worker) NÃO foram corrigidos (fora de escopo).

BASELINE VERDE pós-refatoração: build dos 5 pacotes OK, lint global limpo, 159/159 unit. Integração/e2e exigem Testcontainers/docker (não rodados nesta sessão). Ver [[planning-map-mvp]], [[mnema-mutation-protocol]].
