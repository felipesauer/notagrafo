---
mnema:
  key: NOTA-ADR-12
  kind: decision
  status: proposed
  title: Adotar o chart block do shadcn/ui (reverte NOTA-ADR-8)
  context: >-
    No NOTA-EPIC-13 (ADR-8) evitei o chart block do shadcn achando que ele
    abstraía o Recharts e brigaria com a v3. Pesquisa do NOTA-EPIC-14 (108
    agentes, verificação 3-0 contra a doc oficial
    ui.shadcn.com/docs/components/chart) provou o contrário: o shadcn NÃO
    envolve o Recharts — a doc diz textualmente 'We do not wrap Recharts. This
    means you're not locked into an abstraction'. Você escreve Recharts nativo
    (AreaChart, defs/linearGradient, XAxis) como filhos e só adiciona os
    componentes shadcn onde quer.
  decision: >-
    Passar a usar o chart block do shadcn/ui (ChartContainer, ChartConfig,
    ChartTooltipContent, ChartLegendContent) no lugar dos wrappers próprios
    ChartCard/ChartTooltip minimalistas. Isso REVERTE a NOTA-ADR-8, que evitava
    o bloco por supor incompatibilidade com Recharts v3.
  rationale: >-
    Ganha tooltips ricos (ChartTooltipContent com indicator dot/line/dashed),
    paleta por série single-source (ChartConfig → var(--color-KEY)) e legendas,
    sem perder o acesso à API nativa do Recharts. O motivo original da ADR-8
    (suposta incompatibilidade v3) era infundado. Verificado que funciona no
    stack React 19 + Tailwind 4 + Recharts 3.9.
  consequences: >-
    ChartCard/ChartTooltip da T4 (NOTA-87) serão refatorados sobre
    ChartContainer/ChartConfig na NOTA-98. As páginas de charts (Overview,
    Impostos, Produtos) migram para o novo padrão. ChartContainer exige
    height/min-h explícito (é wrapper de ResponsiveContainer).
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/charts/
    - NOTA-ADR-8
    - NOTA-98
    - NOTA-99
    - NOTA-100
  metadata: {}
  at: '2026-07-03T02:04:47.859Z'
---
# Adotar o chart block do shadcn/ui (reverte NOTA-ADR-8)
