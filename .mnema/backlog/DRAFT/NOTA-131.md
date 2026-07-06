---
mnema:
  key: NOTA-131
  state: DRAFT
  title: >-
    UX: reorganizar navegação — Explorar como hub de Análise, Grafo→Geral,
    Eventos→Sistema
  description: >-
    Usuário quer reestruturar o menu (AppSidebar.tsx RAIL_GROUPS): 'Explorar
    deveria ser um módulo tipo Análise, onde carrega notas fiscais, empresas,
    produtos, impostos e rede; Eventos mover para Sistema; e Grafo para o
    Geral'. Estado atual: GERAL[Início, Explorar]; ANÁLISE[Grafo, Rede,
    Impostos, Eventos]; SISTEMA[Exportações, Configurações]. Proposta a validar
    com o usuário (decision_record): GERAL[Início, Grafo]; ANÁLISE[Explorar
    (hub: notas/empresas/produtos/impostos/rede)]; SISTEMA[Eventos, Exportações,
    Configurações]. Requer decidir se Explorar vira item único que abre o hub de
    entidades (o Explorer já troca entidade via ?entity=) ou um grupo com
    sub-itens. Também revisar MobileNav (usa RAIL_GROUPS). Confirmar antes de
    implementar.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - needs-decision
    - tipo:ux
  estimate: 3
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:41.171Z'
---
# UX: reorganizar navegação — Explorar como hub de Análise, Grafo→Geral, Eventos→Sistema
