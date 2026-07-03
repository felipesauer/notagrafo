---
mnema:
  key: NOTA-109
  state: IN_REVIEW
  title: Nova casca (L invertido) + Explorador de Notas com peek
  description: >-
    Construir a nova casca de navegação: AppShell v2 com sidebar em L invertido
    (entidades agrupadas em Explorar/Análise + seção 'Minhas views' + Cmd+K
    trigger + userbar), header contextual da entidade atual, área de conteúdo
    que troca de modo. Primeiro explorador: Notas fiscais como tabela densa
    (mono nos dados fiscais). Peek reutilizável (shadcn Sheet, side=right)
    navegável por ↑/↓ mantendo a posição e o destaque na lista, peek como search
    param; Enter → detalhe completo. Reaproveitar useNFList. Manter e2e verdes.
  acceptance_criteria:
    - >-
      Sidebar L invertido com grupos Explorar/Análise + Minhas views + Cmd+K
      trigger
    - >-
      Explorador de Notas em tabela densa com peek lateral (Sheet) navegável por
      ↑/↓
    - >-
      peek linkável via search param; destaque da linha selecionada; sem perder
      o lugar
    - build/lint/test:unit/e2e verdes; screenshots claro+escuro
  labels: []
  estimate: 8
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-17
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T22:12:36.485Z'
---
# Nova casca (L invertido) + Explorador de Notas com peek
