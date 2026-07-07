---
mnema:
  key: NOTA-158
  state: DONE
  title: >-
    Polimento UX: empty rico no Grafo + espaço morto em cards pareados
    (Impostos/Exports)
  description: >-
    Ajustes de acabamento da rodada de fundamentos (EPIC-22): (1) estado vazio
    do Grafo passa a usar o EmptyState rico (ícone Waypoints + título +
    descrição) no lugar do texto cru; (2) cards Top NCM/Top CFOP em Impostos
    ganham self-start (sem h-full) para não esticarem iguais — some o vazio sob
    o card menor; (3) Exports com items-start e card History sem flex-stretch,
    ficando compacto no topo. i18n pt-BR/en.
  acceptance_criteria:
    - Empty do Grafo com ícone+título+descrição
    - Top CFOP não estica para a altura do Top NCM
    - Card History do Exports com altura natural
    - lint+tsc+13/13 e2e
  labels:
    - dashboard
    - polish
    - ux
  estimate: 2
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-22
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T00:14:12.626Z'
---
# Polimento UX: empty rico no Grafo + espaço morto em cards pareados (Impostos/Exports)
