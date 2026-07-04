---
mnema:
  key: NOTA-118
  state: IN_REVIEW
  title: 'Fase 0 — Design system: tokens oklch da paleta BI vibrante'
  description: >-
    Reescrever packages/dashboard/src/styles/globals.css para a nova linguagem
    visual (ADR-13): paleta categórica --chart-1..8 vibrante (warm/cool
    alternada, ≥0.15 L entre adjacentes, oklch(L C H) SEM alpha para não quebrar
    o conversor toRgb), superfícies com elevação por lightness
    (bg<card<elevated), status semânticos revibrados claro+escuro, dark mode com
    base cinza-azulada (não preto) e foreground ~90% L. Atualizar NFStatusBadge
    (shared.tsx) para SEMPRE incluir ícone+texto além da cor. Atualizar os 3 hex
    de TIPO_COR_MINIMAP em Graph.tsx para casar com --chart-1..3. Radius pode
    subir p/ ~0.7rem. Tokens de referência no protótipo
    scratchpad/notagrafo-prototype.html.
  acceptance_criteria:
    - >-
      globals.css reescrito com nova paleta --chart-1..8 em oklch(L C H) sem
      alpha e nomes preservados
    - app abre nos 2 temas (claro/escuro) sem regressão visual grosseira
    - >-
      Reagraph (WebGL) e Nivo renderizam com as cores novas via
      resolveTokenColorsRGB (nós não saem pretos)
    - minimap do React Flow com cores corretas (TIPO_COR_MINIMAP atualizado)
    - NFStatusBadge mostra ícone+texto+cor; typecheck/lint verdes
  labels:
    - dashboard
    - design-system
    - redesign
  estimate: 5
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-18
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-04T06:27:54.833Z'
---
# Fase 0 — Design system: tokens oklch da paleta BI vibrante
