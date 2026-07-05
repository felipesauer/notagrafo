---
title: "Fase 7 (NOTA-125): correções da auditoria do redesign — mapa do que mudou"
topics: ["redesign","dashboard","auditoria","responsive","graph","api","reference"]
created_at: 2026-07-05T04:39:16.156Z
updated_at: 2026-07-05T04:39:16.156Z
---
Fase 7 (NOTA-125, no PR #53) corrigiu os problemas que o usuário apontou na auditoria visual de 2026-07-05 do redesign BI. 4 grupos, todos commitados e verificados por screenshot (13/13 e2e verdes):

GRUPO A (layout): novo stores/ui.store.ts (sidebarExpanded/mobileNavOpen/insightsOpen, persistidos). AppSidebar agora EXPANSÍVEL (60↔224px, toggle no rodapé). AppShell grid responsivo (1 col mobile, [auto_1fr] desktop) — sumiu a faixa morta de 60px. Novo MobileNav.tsx (Sheet via hambúrguer na Topbar, md:hidden) — antes não havia nav abaixo de 768px. Insights abre por default em ≥1280px (só vira coluna a partir de xl).

GRUPO B (grafo): enriquecida a query getCompanyGraph (@notagrafo/graph/company.queries.ts) com includeNotas/notasLimit + tipo NotaNoGrafo → /empresa/:cnpj/grafo retorna NF-e como nós (top por valor, teto 30). Rota company.routes.ts aceita includeNotas. Front: layout.mergeGraph mapeia notas (emitente→NF→dest); graph.store com includeProdutos=TRUE por default + includeNotas; CustomNode sem handle duplicado + avatar por centralidade. De 6 nós só-empresa → 14 (produtos) → 44 (notas). SEMPRE rebuildar dist do graph após mexer na query.

GRUPO C (telas usam a API): ExplorerImpostos reescrito — serie mensal (AreaChart empilhado) + topNcm (drill-through) + topCfop, não só totais. NFDetail: EventosTimeline via useNFEvents (era órfão). Overview: barra canceladas (campo do /stats/volume; tipo do useVolume atualizado).

GRUPO D (filtros): NFFilters (Popover no Explorer) com datas/valor min-max/CFOP/NCM/tipoNF/finalidade — os filtros que /nf aceitava e a UI escondia. validateSearch do /explorar ampliado (linkáveis). Status 'inutilizada' adicionado.

Fora de escopo (menor impacto): peek de produto com histórico de preço (usePriceHistory) + hook para /stats/produto/:id/empresas. Layout do grafo com 40+ nós fica denso (notas são opt-in). Relaciona [[redesign-bi-vibrante-entregue]] [[design-tokens-bi-vibrante]].
