---
mnema:
  key: NOTA-47
  state: DONE
  title: Persistir export além da memória (ou documentar a limitação)
  description: >-
    Achado H (BAIXA dívida): ExportService guarda jobs em Map por instância;
    some no restart da API (1 réplica hoje). Decidir: persistir metadados
    (Redis/Neo4j) ou documentar formalmente a limitação no README/contrato.
    Registrar decisão.
  acceptance_criteria:
    - Decisao registrada (persistir vs documentar)
    - >-
      Se persistir: metadados de export sobrevivem a restart da API; se
      documentar: limitacao explicita no README
    - Comportamento coberto por teste se persistido
  estimate: 5
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-9
  sprint_key: NOTA-SPRINT-9
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T02:35:51.987Z'
---
# Persistir export além da memória (ou documentar a limitação)
