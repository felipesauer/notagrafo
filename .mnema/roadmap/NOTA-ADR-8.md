---
mnema:
  key: NOTA-ADR-8
  kind: decision
  status: proposed
  title: Recharts v3 direto com CSS vars; sem o wrapper chart do shadcn
  context: >-
    O dashboard já usa Recharts v3.9 (ComposedChart, BarChart, Treemap,
    LineChart). O wrapper de charts do shadcn foi escrito contra Recharts v2 e
    manipula o shape interno de payload do Tooltip, que mudou na v3.
  decision: >-
    Os gráficos continuam em Recharts v3 consumindo tokens via
    `var(--chart-1..8)` diretamente em fill/stroke. O bloco `chart` do shadcn/ui
    (ChartContainer/ChartTooltipContent) NÃO será instalado; em seu lugar,
    componentes próprios ChartCard.tsx e ChartTooltip.tsx em
    src/components/charts/.
  rationale: >-
    Evita downgrade de Recharts ou bugs sutis de tooltip/tipos. Recharts aceita
    CSS vars nativamente, então o dark mode funciona sem wrapper. Porta aberta
    para adotar o wrapper oficial quando suportar v3.
  consequences: >-
    Tooltips e legendas estilizados manualmente com tokens (uma vez, em
    ChartTooltip.tsx). Paleta categórica centralizada em --chart-* no
    globals.css.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/charts/
    - NOTA-87
    - NOTA-88
    - NOTA-92
  metadata: {}
  at: '2026-07-02T19:29:43.500Z'
---
# Recharts v3 direto com CSS vars; sem o wrapper chart do shadcn
