---
mnema:
  key: NOTA-6
  state: IN_REVIEW
  title: resolveIdUnico() e utils de produto
  description: >-
    Criar packages/core/src/utils/produto.utils.ts com resolveIdUnico(prod): EAN
    se presente e diferente de 'SEM GTIN', senão `${codigo}::${cnpjEmitente}`.
    Lógica num único lugar. Testes: EAN válido / SEM GTIN / ausente / fallback
    código+CNPJ.
  acceptance_criteria:
    - resolveIdUnico implementa a estratégia de identidade do 01 schema-dados.md
    - Testes cobrem EAN válido, SEM GTIN, ausente e fallback código+CNPJ
    - pnpm test:unit verde
    - Lógica não duplicada
  estimate: 2
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-2
  sprint_key: NOTA-SPRINT-2
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T15:30:08.789Z'
---
# resolveIdUnico() e utils de produto
