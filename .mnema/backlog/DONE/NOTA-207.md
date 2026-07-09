---
mnema:
  key: NOTA-207
  state: DONE
  title: 'Docs/DX: corrigir .env.example, README e ruídos de erro (lote básico)'
  description: >-
    Lote de doc/DX: (1) README tabela de portas Mailpit alinhada ao default
    (8025/1025) coerente com .env.example; (2) .env.example ganha
    DEMO_USER_EMAIL/DEMO_USER_SENHA (lidas no seed) e
    MINIO_ROOT_USER/MINIO_ROOT_PASSWORD (usadas no compose); (3) OTEL_EXPORTER
    default alinhado a 'none' (código/README); (4) dev:seed troca '|| true' por
    eco de aviso. catch{} de alert.repository investigado: é JSON.parse com
    fallback (não mascara Neo4j) — falso-positivo, sem mudança.
  acceptance_criteria:
    - portas Mailpit do README coerentes com o default do .env.example
    - DEMO_USER_* e MINIO_ROOT_* presentes no .env.example
    - default de OTEL_EXPORTER consistente entre .env.example/README/código
    - dev:seed sinaliza falha em vez de engolir silenciosamente
    - sem regressão em typecheck/lint
  labels:
    - area:docs
    - dim:dx
  estimate: 2
  priority: 4
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T19:15:33.556Z'
---
# Docs/DX: corrigir .env.example, README e ruídos de erro (lote básico)
