---
mnema:
  key: NOTA-EPIC-17
  kind: epic
  state: OPEN
  title: Reconstrução da navegação — modelo entidade-central + views + peek + Cmd+K
  description: >-
    Fase 5 do redesign. Reconstruir a UX/UI de navegação do dashboard, inspirada
    em ferramentas de processamento de dados (Metabase/Linear/Retool). Pesquisa
    deep-research (102 agentes) validou 3-0 o modelo Linear: a NF-e é a entidade
    central; empresas/produtos/impostos são recortes dela; grafo/rede/eventos
    são lentes analíticas. Nova arquitetura: chrome em L invertido (sidebar de
    entidades + views favoritas + header contextual + área de conteúdo que troca
    de modo); Explorador único com troca de entidade em vez de páginas de lista
    separadas; Peek (Sheet lateral) para drill-down in-place navegável por ↑/↓
    sem perder o lugar; Cmd+K global (chave 44díg→NF, CNPJ→empresa, views,
    ações); views salvas favoritáveis. Densidade "séria de dados": mono nos
    dados fiscais, cor só em status. Protótipo navegável aprovado pelo usuário.
    Implementação incremental reaproveitando as páginas de conteúdo atuais.
    Pilha #28-#51 já mesclada no main; nasce da branch feat/nav-rebuild.
  metadata: {}
  created_at: '2026-07-03T21:55:11.670Z'
  closed_at: null
---
# Reconstrução da navegação — modelo entidade-central + views + peek + Cmd+K
