---
mnema:
  key: NOTA-ADR-13
  kind: decision
  status: proposed
  title: >-
    Direção estética do dashboard: BI denso e vibrante (reverte a estética
    "mono, cor só em status" da Fase 5)
  context: >-
    O arco de redesign Epics 13→17 convergiu numa estética "séria de dados,
    monoespaçada, cor apenas em status" (estilo Linear/Metabase), consolidada na
    Fase 5 (NOTA-EPIC-17). O usuário, ao ver o resultado, pediu explicitamente
    um redesign completo "do zero" para uma estética oposta — dashboards de BI
    vibrantes e coloridos (ref "Business Performance Dashboard") —, escolhendo
    essa direção via AskUserQuestion em 2026-07-03.
  decision: >-
    Adotar uma linguagem visual de BI moderno DENSO e VIBRANTE para o dashboard:
    fundo claro (dark mode com base cinza-azulada, não preto), paleta categórica
    oklch de 8 cores vibrantes (warm/cool alternada, ≥0.15 L entre adjacentes,
    máx 8 categorias com "Outros"), KPI cards com sparkline embutido + delta
    comparativo, bento grid, donut/funil, e um painel lateral de Insights
    persistente com cards de recomendação/atividade derivados de dados reais.
    Status de NF continuam com cor MAS sempre acompanhados de ícone+texto (nunca
    cor sozinha). `/` passa a ser a Home/Overview BI; o Explorer vai para
    `/explorar`.
  rationale: >-
    Escolha do usuário, dono do produto. Embasada por deep-research multi-fonte
    (Cambridge Intelligence, Pencil&Paper, ColorArchive, Evil Martians,
    Tremor/Metabase docs, SaaSFrame): bento grids e KPI+sparkline são padrão BI
    2025-2026; oklch é perceptualmente uniforme (mesma L = mesmo brilho entre
    hues), ideal para paleta categórica vibrante e acessível; navegação
    object-oriented (entidades) maximiza previsibilidade. A vibração é
    reconciliada com acessibilidade via ≥0.15 L entre cores, warm/cool
    alternado, e a regra dura de ícone+texto em status (8% dos homens não
    distinguem verde/vermelho).
  consequences: >-
    Reverte parte do racional visual do NOTA-ADR-8 e da Fase 5 (cor restrita a
    status; mono como default). A retematização é concentrada em
    packages/dashboard/src/styles/globals.css (tokens oklch). Restrições
    preservadas: paleta em oklch(L C H) sem alpha e nomes --chart-1..8 (drop-in
    no conversor toRgb de resolveTheme.ts para WebGL/Nivo); atualizar os 3 hex
    de TIPO_COR_MINIMAP em Graph.tsx; manter os 12 data-testid dos e2e. Mudança
    de rota (/ vira Home, Explorer em /explorar) exige atualizar os specs
    Playwright de navegação/overview.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/styles/globals.css
    - packages/dashboard/src/components/charts/resolveTheme.ts
    - packages/dashboard/src/pages/Graph.tsx
    - packages/dashboard/src/router.tsx
    - packages/dashboard/src/components/layout/AppShell.tsx
    - packages/dashboard/src/components/shared.tsx
    - NOTA-ADR-8
    - NOTA-EPIC-17
  metadata: {}
  at: '2026-07-04T05:38:44.819Z'
---
# Direção estética do dashboard: BI denso e vibrante (reverte a estética "mono, cor só em status" da Fase 5)
