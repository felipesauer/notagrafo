---
mnema:
  key: NOTA-83
  state: IN_REVIEW
  title: >-
    Ressincronizar mirror .mnema (backlog/roadmap) com o banco e versionar audit
    2026-06
  description: >-
    O banco diz 72/72 DONE e 11 epics CLOSED, mas o mirror em disco diverge:
    IN_REVIEW/ tem NOTA-31..39,67,71; READY/ tem NOTA-5,47; e os NOTA-EPIC-*.md
    têm state: OPEN no frontmatter. Além disso .mnema/audit/current.jsonl foi
    deletado e 2026-06.jsonl está sem versionar. Regenerar/sincronizar o mirror
    pela CLI e commitar estado consistente.
  acceptance_criteria:
    - >-
      Arquivos de .mnema/backlog/ refletem o estado real do banco (nada em
      IN_REVIEW/READY para task DONE)
    - Frontmatters dos NOTA-EPIC-*.md refletem CLOSED
    - >-
      Rotação do audit log (2026-06.jsonl) versionada e current.jsonl tratado
      conforme o padrão da ferramenta
    - git status limpo após commit, sem resíduos do mirror antigo
  labels:
    - area:infra
    - origem:auditoria-3
    - tipo:incoerencia
  estimate: 1
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T17:51:21.571Z'
---
# Ressincronizar mirror .mnema (backlog/roadmap) com o banco e versionar audit 2026-06
