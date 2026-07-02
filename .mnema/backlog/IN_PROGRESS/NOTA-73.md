---
mnema:
  key: NOTA-73
  state: IN_PROGRESS
  title: Proteção contra zip bomb no upload de NF-e
  description: >-
    extrairXmls (packages/api/src/nf/upload.utils.ts) descomprime todas as
    entradas do ZIP em memória sem limite de quantidade nem de bytes expandidos
    — o fileSize de 50MB do multipart (app.ts) vale só para o arquivo
    comprimido. Um ZIP pequeno com alta compressão expande para GBs e derruba a
    API (DoS por exaustão de memória). Adicionar limites (máx de entradas e
    bytes descomprimidos agregados) com erro 400 ao exceder.
  acceptance_criteria:
    - >-
      extrairXmls rejeita ZIP com mais de N entradas XML (limite configurável)
      com erro claro
    - >-
      Rejeita quando o total descomprimido excede o limite de bytes, checando o
      header da entrada antes de descomprimir
    - Upload single-XML não é afetado
    - >-
      Testes unit: muitas entradas, entrada descomprimida excessiva, ZIP válido
      continua passando
    - typecheck/lint/unit verdes
  labels:
    - area:api
    - origem:auditoria-3
    - tipo:bug
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T16:41:45.796Z'
---
# Proteção contra zip bomb no upload de NF-e
