---
title: "Design tokens do dashboard: paleta BI vibrante (NOTA-EPIC-18 / ADR-13), formato oklch p/ WebGL"
topics: ["design-system","tokens","oklch","dark-mode","dashboard","redesign","webgl"]
created_at: 2026-07-04T06:21:29.644Z
updated_at: 2026-07-04T06:21:29.644Z
---
O globals.css do dashboard (packages/dashboard/src/styles/globals.css) foi reescrito na Fase 0 (NOTA-118) para a linguagem "BI denso e vibrante" (ADR-13), substituindo a paleta "cor só em status" da Fase 5. Fatos que valem para todo o redesign:

- Paleta categórica --chart-1..8 vibrante warm/cool alternada: cobalto/esmeralda/âmbar/vermelho/teal/violeta/laranja/lime. No escuro é dessaturada (chroma menor) + L maior. DEVE ficar em oklch(L C H) SEM alpha e com esses nomes — o conversor toRgb() em charts/resolveTheme.ts parseia exatamente esse formato p/ Reagraph(WebGL)/Nivo. Não trocar por color-mix()/alpha nesses 8 tokens.
- Superfícies com elevação por lightness: --background < --card < --elevated (token novo, mapeado em @theme como --color-elevated). Claro: bg off-white viés azul, card branco. Escuro: bg rgb(12,16,21) oklch(0.17 0.012 260) — cinza-azulado NÃO preto puro (faixa #0E-#1A da pesquisa); card rgb(19,23,30); foreground ~0.93 L (não branco puro).
- Radius subiu p/ 0.7rem.
- Status agora é PILL com ícone: lib/status.ts ganhou statusBg() (par de fundo tonal, --status-*-bg no claro e escuro); NFStatusBadge (components/shared.tsx) usa color=statusColor + background=statusBg + ícone lucide por status (CheckCircle2/XCircle/AlertTriangle/Ban). Regra a11y: nunca cor sozinha.
- TIPO_COR_MINIMAP (pages/Graph.tsx) espelha --chart-1..3 do tema claro como hex literais #255ff8/#1ebd5b/#f0a800 (canvas do minimap não lê CSS vars). Ao mudar a paleta, recalcular com a MESMA matemática OKLab→sRGB do toRgb.
- Regra nova em @layer base: html { bg-background } além de body — evita vazar preto do agente em overscroll no dark.

Verificação: screenshots Playwright (login demo@notagrafo.local/demo1234, toggle localStorage nfp_tema=claro|escuro, /visao-geral e / e /grafo?cnpj=14200166000187) nos 2 temas; typecheck+lint verdes. Relaciona [[notagrafo-webgl-oklch-e-dist-stale]].
