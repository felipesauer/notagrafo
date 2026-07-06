---
mnema:
  key: NOTA-ADR-17
  kind: decision
  status: proposed
  title: 'Enquadramento do dashboard: max-width por tipo de tela + padding no shell'
  context: >-
    Usuário considerou a UX 'quebrada num contexto amplo' e mandou estudar o
    projeto upcv-pro como referência. Lá o AdminPageContainer usa 'mx-auto
    w-full max-w-screen-xl space-y-6' e o main do DashboardShell centraliza o
    padding. No notagrafo o conteúdo esparramava em telas largas e o Insights
    aparecia em todas as rotas.
  decision: >-
    O conteúdo das páginas passa a ter max-width POR TIPO de tela
    (dashboard/listagens = max-w-screen-xl; forms/config = max-w-3xl),
    centralizado (mx-auto), com o padding responsivo (p-4 md:p-6 lg:p-8)
    aplicado no main do AppShell — não por página. O painel Insights deixa de
    ser global e passa a renderizar somente na Home (Visão Geral).
  rationale: >-
    max-width por tipo evita linhas de leitura longas demais (forms) sem
    desperdiçar espaço em tabelas densas (dashboard). Padding no shell garante
    ritmo uniforme e remove duplicação por página. Insights só na Home reduz
    ruído nas telas operacionais. Alternativa 'largura fluida total' foi
    descartada (esparrama); 'max-width único' foi descartada (ou aperta tabelas
    ou alarga forms).
  consequences: >-
    AppShell centraliza padding; páginas deixam de setar padding próprio. Um
    container de página (por tipo) é introduzido. InsightsPanel fica
    condicionado à rota. upcv-pro é light-only: copiamos só a estrutura de
    enquadramento, não a estratégia de tema.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/layout/AppShell.tsx
    - packages/dashboard/src/components/layout/InsightsPanel.tsx
    - packages/dashboard/src/pages/explorer/Explorer.tsx
    - packages/dashboard/src/pages/Exports.tsx
    - packages/dashboard/src/pages/Config.tsx
  metadata: {}
  at: '2026-07-06T21:46:12.512Z'
---
# Enquadramento do dashboard: max-width por tipo de tela + padding no shell
