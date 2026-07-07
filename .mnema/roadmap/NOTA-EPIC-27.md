---
mnema:
  key: NOTA-EPIC-27
  kind: epic
  state: CLOSED
  title: Alertas e monitoramento proativo (BI fiscal)
  description: >-
    Transforma o notagrafo de passivo (você olha) em proativo (ele avisa).
    Consome as detecções do EPIC-26 (anomalias) + as regras que o InsightsPanel
    já calcula (carga tributária, concentração de fornecedor, etc.). Escopo: (1)
    Motor de regras de alerta configuráveis — condições sobre os dados (NF acima
    de X, concentração > Y%, pico/queda de volume, anomalia detectada, NF com
    imposto zerado suspeito); avaliadas na ingestão ou sob demanda. (2)
    Persistência dos alertas disparados (nó/coleção no grafo ou store). (3)
    Centro de notificações no dashboard (o ExportWatcher/toast já é a base do
    canal) — sino/lista com alertas não-lidos, marcar como lido. (4) Config de
    alertas na tela de Configurações (ligar/desligar regras, definir limiares).
    Escopo de análise — alerta é informativo, não bloqueia. Depende do EPIC-26
    para as detecções.
  metadata: {}
  created_at: '2026-07-07T16:32:41.855Z'
  closed_at: '2026-07-07T19:42:03.059Z'
---
# Alertas e monitoramento proativo (BI fiscal)
