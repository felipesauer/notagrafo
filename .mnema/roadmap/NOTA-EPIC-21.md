---
mnema:
  key: NOTA-EPIC-21
  kind: epic
  state: CLOSED
  title: >-
    DataTable padrão: ordenação, paginação configurável e destaque em todas as
    tabelas + alinhamento da Home
  description: >-
    Usuário pediu: (1) ordenação por coluna em todas as tabelas; (2) paginação
    configurável (seletor de linhas por página + Ant/Próx + X-Y de Z); (3)
    'destaque do fundo da tela' = card/contraste em volta + zebra/hover nas
    linhas + cabeçalho sticky; (4) cards da Home ainda desalinhados; (5) nem
    todas as tabelas foram trocadas para o padrão. Inventário: nenhuma tabela
    tem ordenação hoje (useTableSort órfão); só Events tem paginação real
    (offset/limit, page size fixo 50). Backend: /nf suporta orderBy(5
    cols)+order+cursor (server-side viável sem tocar backend); /stats/eventos
    suporta offset/limit; rankings (empresas/produtos/impostos) têm limit baixo
    hardcoded (10/20/8) e sem orderBy — ordenação client-side via useTableSort.
    Estratégia: criar componente DataTable reutilizável
    (card+sticky+zebra/hover+ordenação+paginação com seletor de page size) e
    aplicar em TODAS as listagens; client-side onde os dados já vêm inteiros,
    server-side na lista de NF-e (orderBy/order + cursor) e Events
    (offset/limit). Alinhar bento da Home. Base: main (branding+consistência já
    mergeados).
  metadata: {}
  created_at: '2026-07-06T20:03:42.684Z'
  closed_at: '2026-07-06T20:30:58.633Z'
---
# DataTable padrão: ordenação, paginação configurável e destaque em todas as tabelas + alinhamento da Home
