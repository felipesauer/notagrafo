---
mnema:
  key: NOTA-75
  state: READY
  title: >-
    Implementar LGPD_MASK_CPF (pseudonimização de CPF em logs e UI) ou remover a
    claim
  description: >-
    LGPD_MASK_CPF é documentada no README (l.185), .env.example e .plan/01
    (regra LGPD) mas tem ZERO referências no código (grep no monorepo, inclusive
    nomes alternativos mask/pseudonim). Quem liga a flag acredita mascarar CPFs
    de MEI e não está. Implementar conforme plan/01: pseudonimizar CPFs (11
    dígitos no campo cnpj) nos logs da API/worker e na UI do dashboard quando
    ativa; alinhar README/.env.example ao real.
  acceptance_criteria:
    - >-
      Com LGPD_MASK_CPF=true, logs da API e worker não expõem CPF em claro (cnpj
      de 11 dígitos mascarado)
    - >-
      Com VITE_LGPD_MASK_CPF=true, dashboard exibe CPFs mascarados (CNPJText e
      afins)
    - Flag off (default) mantém comportamento atual
    - README/.env.example descrevem exatamente o que a flag faz
    - Testes unit do util de máscara e de um ponto de uso em API e dashboard
  labels:
    - area:api
    - area:dashboard
    - area:worker
    - origem:auditoria-3
    - tipo:gap
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-12
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-02T16:36:48.209Z'
---
# Implementar LGPD_MASK_CPF (pseudonimização de CPF em logs e UI) ou remover a claim
