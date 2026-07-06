---
mnema:
  key: NOTA-ADR-16
  kind: decision
  status: proposed
  title: >-
    DataTable: ordenação/paginação client-side por padrão, server-side só na
    lista de NF-e e Events
  context: >
    Nenhuma tabela tinha ordenação; useTableSort estava órfão. Paginação só em
    Events. Backend: /nf tem orderBy(5 cols)+cursor; /stats/eventos tem
    offset/limit; rankings não têm orderBy e vêm com limite pequeno inteiro.
    Usuário quer ordenação em todas + paginação configurável + destaque
    visual.">
  decision: >-
    Um componente DataTable reutilizável encapsula card+sticky
    header+zebra/hover+ordenação por coluna (aria-sort)+rodapé de paginação
    (seletor 10/25/50/100 + Anterior/Próxima + 'X-Y de Z'). Rankings
    (Empresas/Produtos/Impostos), Últimas NFs e itens da NF ordenam/paginam
    CLIENT-SIDE via useTableSort sobre o array já carregado. A lista de NF-e
    (ExplorerNotas) ordena SERVER-SIDE (orderBy/order que o /nf já aceita) e
    pagina por cursor (Anterior/Próxima, sem salto para página N). Events pagina
    server-side por offset/limit (já existe) e ganha o seletor de page size.
  rationale: >-
    Client-side é imediato e sem risco onde os dados já vêm inteiros (top-N
    pequenos, itens embutidos). Server-side é obrigatório na lista de NF-e
    (paginada por cursor — ordenar só o buffer local enganaria) e em Events (já
    é offset/limit). Evita estender vários endpoints do backend agora. Para
    rankings client-side fazer sentido sobre um universo maior, subir o limit
    hardcoded dos hooks (10/20) para um teto razoável.
  consequences: >-
    Novo componente DataTable + reaproveita useTableSort (deixa de ser órfão).
    Cursor não permite salto para página arbitrária na NF-e (só Ant/Próx) —
    aceitável. Corrigir o comentário desatualizado de useTableSort (dizia que
    /nf não expõe ordenação). Subir limits dos hooks de ranking.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/DataTable.tsx
    - packages/dashboard/src/hooks/useTableSort.ts
    - packages/dashboard/src/api/hooks.ts
    - NOTA-EPIC-21
  metadata: {}
  at: '2026-07-06T20:04:03.179Z'
---
# DataTable: ordenação/paginação client-side por padrão, server-side só na lista de NF-e e Events
