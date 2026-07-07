---
mnema:
  key: NOTA-152
  state: DONE
  title: 'Enquadramento: max-width por tipo de tela + padding centralizado no shell'
  description: >-
    Hoje o conteúdo esparrama em telas largas (sem max-width) e o padding está
    espalhado por página. Inspirado no AdminPageContainer do upcv-pro (mx-auto
    w-full max-w-screen-xl space-y-6 pb-8) + <main> do DashboardShell (p-4
    md:p-6 lg:p-8). Criar PageContainer que aplique max-width POR TIPO
    (dashboard/listagens = max-w-screen-xl; forms/config = max-w-3xl)
    centralizado, e centralizar o padding responsivo no AppShell. As páginas
    não-fullbleed passam a receber o container.
  acceptance_criteria:
    - Conteúdo centraliza e para de esparramar em telas >1600px
    - Padding responsivo (p-4 md:p-6 lg:p-8) vem do shell
    - Listagens usam max-w-screen-xl; Config usa max-w-3xl
    - e2e verdes
  labels:
    - dashboard
    - layout
    - ux
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-22
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T00:24:27.654Z'
---
# Enquadramento: max-width por tipo de tela + padding centralizado no shell
