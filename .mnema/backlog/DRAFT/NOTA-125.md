---
mnema:
  key: NOTA-125
  state: DRAFT
  title: >-
    Fase 7 — Correções da auditoria: mobile/sidebar, grafo rico, telas que
    subutilizam a API, filtros
  description: >-
    Auditoria visual+funcional (2026-07-05) confirmou 6 grupos de problema no
    redesign BI. Correção em grupos verificáveis por screenshot:


    GRUPO A — Layout/responsividade (ALTA): AppShell grid [60px_1fr] fixo
    reserva 60px vazios no mobile e não há nav mobile; AppSidebar fixo w-60px
    sem expandir. Fix: grid responsivo (1fr no mobile, 60px/expandido no
    desktop), sidebar expansível ícone↔rótulo com toggle persistido (store),
    Sheet mobile (hambúrguer na Topbar reusando a lista de itens), Insights
    aberto por padrão em telas largas.


    GRUPO B — Grafo rico via API (ALTA, decisão do usuário): enriquecer
    /empresa/:cnpj/grafo (company.queries.ts no @notagrafo/graph) para retornar
    também nós de NF-e e produtos (os 3 tipos que a legenda promete). Front
    (Graph.tsx/layout.ts): mapear os novos nós, produtos ON por default, layout
    radial que não exclui produtos, tamanho de nó por centralidade/totalNFs,
    remover handle duplicado no CustomNode. Rebuildar dist do graph.


    GRUPO C — Telas que jogam a API fora (ALTA): Impostos renderizar serie
    mensal + topNcm + topCfop (não só totais) + filtros data/uf; Overview
    mostrar 'canceladas' do /stats/volume; produto ganha peek com histórico de
    preço (usePriceHistory) + empresas ligadas (novo hook
    /stats/produto/:id/empresas); eventos no NFDetail (useNFEvents órfão).


    GRUPO D — Filtros de /nf (ALTA): painel de filtros (datas, valor min/max,
    tipoNF, finalidade, cfop, ncm, comImposto) no Explorer; ampliar
    validateSearch em router.tsx; incluir status 'inutilizada'.


    Cada grupo: implementar → rebuildar container → screenshot 2 temas + e2e →
    commit. Manter 13/13 e2e verdes e os 12 data-testid.
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
  labels: []
  estimate: 13
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-05T04:04:01.401Z'
---
# Fase 7 — Correções da auditoria: mobile/sidebar, grafo rico, telas que subutilizam a API, filtros
