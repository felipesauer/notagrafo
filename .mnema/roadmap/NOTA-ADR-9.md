---
mnema:
  key: NOTA-ADR-9
  kind: decision
  status: proposed
  title: >-
    Ordenação de tabelas com hook próprio useTableSort; sem TanStack Table;
    NFList sem sort
  context: >-
    GET /nf pagina por cursor e a API não tem parâmetro sort/order — ordenar só
    a página atual no cliente seria enganoso. As demais tabelas são rankings
    top-10/20 completos no cliente.
  decision: >-
    Ordenação client-side via hook próprio useTableSort (~30 linhas, com
    aria-sort) apenas nas tabelas top-N totalmente carregadas (Empresas,
    Produtos, rankings de Impostos). TanStack Table não será adotada. A lista de
    NFs fica sem ordenação por coluna neste epic.
  rationale: >-
    TanStack Table adicionaria dependência e um segundo paradigma de tabela para
    3 casos triviais. Sort server-side em /nf exige mudança de API (fora do
    escopo do redesign) — registrado como trabalho futuro.
  consequences: >-
    Trabalho futuro: parâmetro sort na API de /nf + ordenação na NFList. Até lá,
    a coluna de emissão segue a ordenação default da API.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/hooks/useTableSort.ts
    - packages/api
    - NOTA-91
    - NOTA-92
  metadata: {}
  at: '2026-07-02T19:29:49.264Z'
---
# Ordenação de tabelas com hook próprio useTableSort; sem TanStack Table; NFList sem sort
