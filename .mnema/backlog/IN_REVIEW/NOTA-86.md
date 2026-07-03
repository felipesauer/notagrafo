---
mnema:
  key: NOTA-86
  state: IN_REVIEW
  title: >-
    Shell: AppShell, sidebar colapsável + drawer mobile, breadcrumb, user menu,
    sonner, login
  description: >-
    Substituir AppLayout/Sidebar/Header por src/components/layout/: AppShell
    (SidebarProvider + Sidebar collapsible=icon + SidebarInset, monta Toaster
    sonner ligado ao theme.store e ExportWatcher), NavSidebar (8 itens lucide,
    colapso para ícones com Tooltip, drawer mobile via Sheet,
    data-testid=app-sidebar, footer UserMenu com auth.store + Sair), SiteHeader
    (SidebarTrigger + Breadcrumb shadcn + toggles tema/idioma; sino removido),
    breadcrumbs.ts corrigindo o mapa TITULOS (adiciona /impostos e trata
    /nf/$chave). ExportWatcher headless: polling 10s → toast persistente com
    ação Baixar; deletar ExportBanner. Login restylado (Card/Input/Label/Button)
    preservando getByLabel e role=alert. ErrorBoundary montado em main.tsx com
    texto via i18n.
  acceptance_criteria:
    - Breadcrumb correto em todas as rotas incl. /impostos e /nf/$chave
    - Sidebar colapsa para ícones e vira drawer <768px
    - Toast de export pronto com ação Baixar; ExportBanner removido
    - ErrorBoundary montado; AppLayout/Sidebar/Header antigos deletados
    - e2e verdes
  labels:
    - area:dashboard
    - tipo:redesign
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-13
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-03T00:07:05.508Z'
---
# Shell: AppShell, sidebar colapsável + drawer mobile, breadcrumb, user menu, sonner, login
