---
mnema:
  key: NOTA-125
  state: IN_REVIEW
  title: >-
    Fase 7 — Correções da auditoria: mobile/sidebar, grafo rico, telas que
    subutilizam a API, filtros
  description: >-
    Auditoria visual+funcional (2026-07-05) confirmou 6 grupos de problema no
    redesign BI. Correção em grupos verificáveis por screenshot. GRUPO A —
    Layout/responsividade: grid responsivo, sidebar expansível com toggle
    persistido, Sheet mobile, Insights aberto por padrão em telas largas. GRUPO
    B — Grafo rico via API: enriquecer /empresa/:cnpj/grafo p/ retornar
    NF-e+produtos como nós; front mapeia os 3 tipos, produtos ON, layout radial
    c/ produtos, tamanho por centralidade, remover handle duplicado. GRUPO C —
    Telas: Impostos usa serie+topNcm+topCfop; Overview mostra canceladas;
    produto peek c/ histórico+empresas; eventos no NFDetail. GRUPO D — Filtros
    de /nf no Explorer + validateSearch ampliado + status inutilizada. Cada
    grupo: implementar→rebuild→screenshot 2 temas+e2e→commit. 13/13 e2e verdes,
    12 data-testid mantidos.
  acceptance_criteria:
    - >-
      Mobile (<768px): sem faixa morta, nav mobile funcional (Sheet), sidebar
      expansível com toggle persistido, Insights aberto por padrão em telas
      largas
    - >-
      Grafo /grafo mostra os 3 tipos de nó (empresa/NF/produto) com dados reais
      da API enriquecida; tamanho por centralidade; sem handle duplicado
    - >-
      Tela Impostos usa serie+topNcm+topCfop; Overview mostra canceladas;
      produto tem peek com histórico+empresas; NFDetail tem timeline de eventos
    - >-
      Explorer tem painel de filtros de NF
      (datas/valor/tipo/finalidade/cfop/ncm/comImposto) + status inutilizada;
      validateSearch ampliado
    - >-
      13/13 e2e verdes; typecheck/lint/build verdes; screenshots dos 2 temas por
      grupo
  labels:
    - api
    - auditoria
    - dashboard
    - graph
    - redesign
    - responsive
  estimate: 13
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-05T04:38:58.609Z'
---
# Fase 7 — Correções da auditoria: mobile/sidebar, grafo rico, telas que subutilizam a API, filtros
