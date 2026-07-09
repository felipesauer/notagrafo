---
mnema:
  key: NOTA-207
  state: DRAFT
  title: 'Docs/DX: corrigir .env.example, README e ruídos de erro (lote básico)'
  description: >-
    Lote de correções triviais de doc/DX afins (um único branch/PR conforme
    orientação). (1) README 'Portas e serviços' lista Mailpit 8035/1035, mas
    compose usa 8025/1025 (.env.example confirma) — corrigir. (2) .env.example
    (que se diz 'referência completa') omite DEMO_USER_EMAIL/DEMO_USER_SENHA
    (lidas em seed/index.ts:12-13, documentadas no README) e
    MINIO_ROOT_USER/MINIO_ROOT_PASSWORD (usadas no compose:54-55) — adicionar.
    (3) default de OTEL_EXPORTER divergente: .env.example diz 'console', README
    e código (telemetry.ts:20) dizem 'none' — alinhar. (4) catch{} vazio em
    alert.repository.ts:84,179 pode mascarar erro de query Neo4j — ao menos
    logar. (5) dev:seed usa '|| true' que engole falhas do seed — avaliar log de
    warning. Manter mudanças de doc separadas dos fixes de código.
  acceptance_criteria:
    - portas Mailpit do README batem com o compose
    - DEMO_USER_* e MINIO_ROOT_* presentes no .env.example
    - default de OTEL_EXPORTER consistente entre .env.example/README/código
    - catch{} de alert.repository ao menos loga o erro
    - nenhuma regressão em lint/typecheck/testes
  labels:
    - area:docs
    - dim:dx
  estimate: 2
  priority: 4
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:15.406Z'
---
# Docs/DX: corrigir .env.example, README e ruídos de erro (lote básico)
