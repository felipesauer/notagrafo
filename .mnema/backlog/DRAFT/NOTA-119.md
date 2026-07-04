---
mnema:
  key: NOTA-119
  state: DRAFT
  title: >-
    Fase 1 — Shell & navegação: AppShell novo, rotas / e /explorar, Insights
    panel
  description: >-
    Reescrever components/layout/AppShell.tsx: sidebar fina de ícones (adotar
    ui/sidebar.tsx do shadcn, hoje código morto, no lugar do rail inline),
    topbar com busca/Cmd+K/tema/idioma, e coluna de Insights colapsável à
    direita (moldura, populada na Fase 2). Ajustar router.tsx: / vira
    Home/Overview, Explorer vai para /explorar (entidades via ?entity=).
    Atualizar CommandPalette.tsx e i18n/pt-BR.ts (bloco sidebar.*) para a nova
    IA. Manter Cmd+K, saved views (useSavedViews) e peek. Preservar data-testid
    app-sidebar.
  acceptance_criteria:
    - / renderiza a Home; /explorar renderiza o Explorer com troca de entidade
    - sidebar de ícones + topbar + Insights panel colapsável (persiste estado)
    - Cmd+K e peek funcionam; i18n atualizado sem chaves órfãs
    - data-testid app-sidebar preservado; e2e de navegação atualizados e verdes
    - typecheck/lint/build verdes
  labels:
    - dashboard
    - navigation
    - redesign
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:42.515Z'
---
# Fase 1 — Shell & navegação: AppShell novo, rotas / e /explorar, Insights panel
