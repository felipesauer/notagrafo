---
mnema:
  key: NOTA-EPIC-10
  kind: epic
  state: CLOSED
  title: Padronizar identificadores de código para inglês (i18n de código)
  description: >-
    Boa parte do código-fonte usa identificadores em português (nomes de
    funções, variáveis, hooks, componentes, tipos auxiliares, nomes de arquivo e
    comentários) — ex.: `validarNFe`, `buscarPorEmail`, `criarUsuario`,
    `serializarNota`, `gerarNFe`, `registrarConsulta`, `aplicarLayout`, hooks
    `useTopEmpresas`/`useHistoricoPreco`, componentes `NoCustom`/`GrafoInterno`,
    arquivos `produto.utils.ts`/`empresa.queries.ts`. Este épico padroniza tudo
    isso para inglês.


    ESCOPO (decidido com o Felipe em 2026-06-28): apenas a CAMADA DE LÓGICA DE
    CÓDIGO. Traduzir: nomes de funções/métodos, variáveis locais e parâmetros,
    hooks/componentes React, tipos/interfaces auxiliares, nomes de arquivos
    `.ts/.tsx` e comentários.


    FORA DE ESCOPO (NÃO mexer — risco de quebrar contrato/schema): campos do
    modelo de domínio NF-e que espelham a nomenclatura oficial SEFAZ/NFe e
    formam o contrato da API definido em `.plan/` (ex.: `chaveAcesso`,
    `razaoSocial`, `valorTotal`, `cnpjEmitente`, `dataEmissao`, interfaces
    `NotaFiscalNode`/`EmpresaNode`/`ProdutoNode` enquanto representam o
    payload), labels e propriedades do Neo4j (`:Usuario`, `:NotaFiscal`, etc.),
    enums de status do domínio (`'ativa'|'cancelada'|...`), nomes de tags/grupos
    do XML da NFe e os XSDs. Onde uma interface mistura conceito de código e
    payload, manter os nomes de campo que cruzam a fronteira (JSON da API /
    propriedades do grafo) e só renomear identificadores puramente internos.


    ENTREGA: 1 task por pacote (core, graph, api, worker, dashboard), em PRs
    separados. Atenção às dependências: funções exportadas do `core` (ex.:
    `validarNFe`) e do `graph` são consumidas por api/worker/dashboard; renomear
    no produtor exige acompanhar os consumidores. Cada task deve manter build,
    typecheck, lint e a suíte de testes (unit + integração) verdes, e atualizar
    os testes que referenciam os identificadores renomeados.
  metadata: {}
  created_at: '2026-06-29T02:20:46.114Z'
  closed_at: '2026-06-30T19:43:06.181Z'
---
# Padronizar identificadores de código para inglês (i18n de código)
