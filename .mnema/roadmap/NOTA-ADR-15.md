---
mnema:
  key: NOTA-ADR-15
  kind: decision
  status: proposed
  title: Remover a timeline de Eventos da tela de detalhe da NF
  context: >-
    Usuário pediu 'eventos da nota fiscal deveria sair da tela'. O detalhe tinha
    uma coluna lateral com mini-grafo + timeline de eventos.
  decision: >-
    A timeline de eventos (EventosTimeline) sai da página de detalhe da NF
    (NFDetail.tsx). A auditoria de eventos permanece disponível na lente Eventos
    do Explorer (/explorar?entity=eventos).
  rationale: >-
    Deixa o detalhe focado nos dados fiscais (identificação, partes, itens,
    totais). Evita duplicar a função da lente Eventos. Usuário escolheu remover
    (não mover para aba/accordion).
  consequences: >-
    EventosTimeline e o uso de useNFEvents saem de NFDetail.tsx; a coluna
    lateral fica só com o mini-grafo (revisar equilíbrio do layout). O hook
    useNFEvents continua usado na lente Eventos — confirmar que não fica
    totalmente órfão.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/pages/NFDetail.tsx
    - NOTA-134
  metadata: {}
  at: '2026-07-06T16:21:38.162Z'
---
# Remover a timeline de Eventos da tela de detalhe da NF
