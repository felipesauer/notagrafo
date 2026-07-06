---
title: "Redesign BI vibrante (NOTA-EPIC-18) entregue em 6 fases no PR #53 — mapa do que mudou"
topics: ["redesign","dashboard","ux","epic-18","pr-53","reference"]
created_at: 2026-07-04T16:44:40.042Z
updated_at: 2026-07-04T16:44:40.042Z
---
O redesign "BI denso e vibrante" (NOTA-EPIC-18, ADR-13) foi implementado em 6 fases incrementais, tudo na branch feat/redesign-bi-tokens → PR #53 (7 commits, 1 por fase). Estado: NOTA-118..124 todas IN_REVIEW aguardando review/merge; epic NÃO fechado (respeitando o gate de review). 13/13 e2e verdes.

Mapa do que mudou (para orientar trabalho futuro):
- Fase 0 (118): globals.css paleta oklch vibrante — ver [[design-tokens-bi-vibrante]]. Status virou PILL com ícone (shared.tsx NFStatusBadge + statusBg em lib/status.ts).
- Fase 1 (119): NAVEGAÇÃO MUDOU. `/` = Home BI (OverviewPage); Explorer = `/explorar` (leva o validateSearch rico); `/visao-geral` redireciona a `/`. Shell novo: AppShell.tsx = grid rail|topbar|outlet|insights. NOVOS componentes: components/layout/{AppSidebar,Topbar,InsightsPanel}.tsx. SecondaryHeader.tsx REMOVIDO. Explorer.tsx perdeu o rail, ganhou tabs de entidade + ViewsMenu.
- Fase 2 (120): InsightsPanel populado com dados reais (useOverview/useTopCompanies/useTaxStats). NOVO components/charts/BarList.tsx (consolidou UfBars/FornecedorBars).
- Fase 3 (121): NOVO stores/density.store.ts + components/DensityToggle.tsx; tabelas usam densityClass()+data-sticky; regras em globals.css (@layer base + table.d-compact/d-relaxed + table[data-sticky] thead).
- Fase 4 (122): RedeGraph.tsx ganhou legenda de UF. Anti-hairball já existia (limite/cluster/tamanho).
- Fase 5 (123): DensityToggle também em Settings (card Aparência).
- Fase 6 (124): contraste WCAG AA — cores de texto dos --status-* do tema CLARO escurecidas (ativa 0.50, cancelada 0.53, denegada 0.53, inutilizada 0.48) p/ ≥4.5 sobre o fundo tonal.

Gotchas reconfirmados: e2e/screenshots do grafo WebGL SÓ no build 8080 (dev 5173 dá erro falso) — ver observações. Rebuildar container (--no-cache) antes de e2e após mudança de código.
