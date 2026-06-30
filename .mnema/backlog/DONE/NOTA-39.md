---
mnema:
  key: NOTA-39
  state: DONE
  title: 'Robustez: upload ZIP atômico + seed reportar erros + cobertura'
  description: >-
    Robustez da auditoria: (#8) POST /nf/upload de ZIP não é atômico — validar
    XSD e checar duplicata de TODOS antes de enfileirar; (#9) runSeed engole
    erros — logar primeiro erro/resumo por tipo; (#10) testes faltantes:
    getNotaFiscal, historicoPrecoProduto, upload de ZIP múltiplo.
  acceptance_criteria:
    - >-
      POST /nf/upload com ZIP valida+checa duplicata de todos antes de
      enfileirar (sem enfileiramento parcial)
    - runSeed loga o primeiro erro e resumo por tipo (não engole)
    - Testes de integração para getNotaFiscal e historicoPrecoProduto
    - Teste de upload de ZIP com múltiplos XMLs (sucesso e com duplicata)
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-8
  sprint_key: NOTA-SPRINT-8
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T19:42:07.771Z'
---
# Robustez: upload ZIP atômico + seed reportar erros + cobertura
