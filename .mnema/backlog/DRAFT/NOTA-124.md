---
mnema:
  key: NOTA-124
  state: DRAFT
  title: Fase 6 — Polish & acessibilidade (WCAG AA), dark mode fino, 11 specs verdes
  description: >-
    Fase final de refino: ajuste fino do dark mode (contraste, halation),
    garantir contraste WCAG AA em textos/badges/charts, navegação por teclado e
    ARIA no Cmd+K/peek/sidebar/insights, respeitar prefers-reduced-motion
    (wrappers em Motion.tsx), revisão de densidade e consistência de tokens.
    Rodar e verdejar os 11 specs Playwright (com --workers=2 local para evitar
    flaky), unit Vitest, e um check de a11y.
  acceptance_criteria:
    - contraste WCAG AA verificado em textos/badges/charts nos 2 temas
    - >-
      teclado+ARIA no Cmd+K/peek/sidebar/insights; prefers-reduced-motion
      respeitado
    - os 11 specs Playwright verdes (workers=2 local) e unit Vitest verdes
    - revisão de densidade/tokens sem inconsistências
    - typecheck/lint/build verdes
  labels:
    - a11y
    - dashboard
    - polish
    - redesign
  estimate: 4
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T05:39:53.995Z'
---
# Fase 6 — Polish & acessibilidade (WCAG AA), dark mode fino, 11 specs verdes
