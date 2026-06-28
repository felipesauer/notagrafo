---
mnema:
  key: NOTA-ADR-5
  kind: decision
  status: accepted
  title: Persistir metadados de export no Redis (sobreviver a restart)
  context: >-
    ExportService guardava jobs num Map em memória por instância; sumiam no
    restart da API (achado H da auditoria 2). A API roda 1 réplica, mas o
    restart perde exports em andamento/prontos.
  decision: >-
    Persistir os metadados do ExportJob num hash Redis com TTL (chave
    export:<id>), mantendo o arquivo gerado em disco local. No obter(), se não
    estiver em memória, recupera do Redis. O TTL do Redis espelha o
    EXPORT_TTL_HOURS. O ExportService passa a receber a conexão Redis opcional
    (fallback para memória quando ausente — testes unit).
  rationale: null
  consequences: >-
    Metadados sobrevivem a restart da API; base para multi-réplica futura (o
    arquivo em disco ainda é por-nó, mas o status é compartilhável).
    ExportService ganha dependência opcional de Redis.
  superseded_by: null
  authored_by: 019f03ba-735c-725c-b52a-22a88c9abe61
  impacts: []
  metadata: {}
  at: '2026-06-28T23:13:22.270Z'
---
# Persistir metadados de export no Redis (sobreviver a restart)
