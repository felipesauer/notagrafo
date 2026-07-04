---
mnema:
  key: NOTA-EPIC-18
  kind: epic
  state: OPEN
  title: Redesign UX/UI "BI denso e vibrante" (do zero)
  description: >-
    Redesign completo (do zero) da UX/UI do @notagrafo/dashboard, aprovado pelo
    usuário em 2026-07-03 a partir de referências de dashboards de BI. É uma
    VIRADA DELIBERADA em relação ao arco Epics 13→17 (que culminou na Fase 5
    "entidade-central estilo Linear/Metabase": sério, mono, cor só em status). A
    nova direção é BI moderno DENSO e VIBRANTE (ref "Business Performance
    Dashboard": fundo claro, cor categórica forte, KPI cards com
    sparkline+delta, donut/funil, e um painel lateral de Insights com cards de
    recomendação/atividade ao vivo).


    DECISÕES DO USUÁRIO (AskUserQuestion, 2026-07-03):

    - Escopo: redesign completo do zero (não reskin) — repensar
    navegação/fluxos/visual.

    - Estética: BI denso e vibrante.

    - `/` vira a Home/Overview BI (landing) e o Explorer vai para `/explorar`.

    - Painel de Insights usa DADOS REAIS (regras simples sobre a API existente —
    última NF, variação de carga tributária, concentração de fornecedor, jobs
    recentes; sem IA/novo backend).

    - Execução começa por um PROTÓTIPO visual navegável (Artifact HTML) para
    validar a direção antes de tocar o código real. Protótipo v1 publicado.


    STACK MANTIDA: React 19 + Vite + Tailwind v4 (CSS-first, @theme inline em
    globals.css) + shadcn/ui (new-york) + Recharts (via ChartContainer, ADR-12)
    + Nivo (Sankey) + React Flow+dagre (ego-graph SVG) + Reagraph (WebGL rede).
    Dados/endpoints existentes reaproveitados.


    EMBASAMENTO: deep-research multi-fonte (~120 claims — Cambridge
    Intelligence, Pencil&Paper, ColorArchive, Evil Martians, Tremor/Metabase
    docs, SaaSFrame). Princípios: bento 12/4-col; 4-6 KPIs com contexto
    comparativo + sparkline no card; paleta oklch categórica warm/cool alternada
    ≥0.15 L, máx 8, nunca cor sozinha p/ status (sempre ícone+texto); dark mode
    base cinza (não preto), cores redesenhadas; grafo NUNCA inteiro na UI
    (anti-hairball), filtrar por tipo de nó + tamanho por centralidade; tabelas
    números right-align+tabular, densidade ajustável; nav object-oriented =
    previsibilidade.


    RESTRIÇÕES/GOTCHAS (memórias): oklch quebra WebGL → paleta em oklch(L C H)
    sem alpha, nomes --chart-1..8, passar por resolveTokenColorsRGB (toRgb
    genérico); atualizar os 3 hex do TIPO_COR_MINIMAP em Graph.tsx;
    @notagrafo/core só por subpath; rebuildar dist do graph; preservar os 12
    data-testid dos 11 specs Playwright. Conta Pro → fases pequenas, verificação
    no main loop.


    ENTREGA EM FASES (incremental, app sempre funcional): P (protótipo Artifact
    — feito), 0 (design system/tokens globals.css), 1 (shell+nav / e /explorar +
    Insights panel), 2 (Home/Overview bento+KPIs+Insights reais+Bar List), 3
    (Explorer + tabelas densas + DensityToggle + peek), 4 (grafo/rede
    anti-hairball), 5 (NFDetail + Exportações wizard + Configurações), 6 (polish
    + dark mode fino + a11y WCAG AA; 11 specs verdes). Cada fase = 1+ PR
    pequeno; commitar .mnema/ junto.
  metadata: {}
  created_at: '2026-07-04T05:38:29.156Z'
  closed_at: null
---
# Redesign UX/UI "BI denso e vibrante" (do zero)
