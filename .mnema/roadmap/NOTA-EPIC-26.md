---
mnema:
  key: NOTA-EPIC-26
  kind: epic
  state: CLOSED
  title: Análises comparativas e detecção de anomalias (BI fiscal)
  description: >-
    Direção de produto: ferramenta de ANÁLISE fiscal (não SaaS/multi-tenant).
    Base analítica que também alimenta os alertas (EPIC de Alertas). Escopo: (1)
    Comparação de períodos — KPIs e séries mês-a-mês vs período anterior / YoY,
    lado a lado (hoje só há delta simples no KpiCard); nova agregação na API +
    UI (seletor de período comparativo). (2) Drill-down temporal — clicar num
    ponto/mês do gráfico de volume abre a lista de NF daquele período (deep-link
    para /explore com filtro de data). (3) Detecção de duplicatas — NF com mesmo
    emitente+valor+data próximos, ou chaves quase idênticas. (4) Gaps de
    numeração — sequências de nNF com buracos por emitente/série (possível NF
    faltante/problema). Backend: novas queries de agregação temporal + detecção;
    API endpoints; dashboard: comparativo na Overview + card/tela de anomalias.
    Reusa stats/queries existentes. Escopo de análise — não corrige, só
    sinaliza.
  metadata: {}
  created_at: '2026-07-07T16:31:44.839Z'
  closed_at: '2026-07-07T18:33:18.830Z'
---
# Análises comparativas e detecção de anomalias (BI fiscal)
