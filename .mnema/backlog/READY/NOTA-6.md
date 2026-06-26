---
mnema:
  key: NOTA-6
  state: READY
  title: resolveIdUnico() e utils de produto
  description: >-
    Criar packages/core/src/utils/produto.utils.ts com resolveIdUnico(prod): EAN
    se presente e diferente de 'SEM GTIN', senão `${codigo}::${cnpjEmitente}`.
    Lógica num único lugar. Testes: EAN válido / SEM GTIN / ausente / fallback
    código+CNPJ.
  acceptance_criteria:
    - resolveIdUnico implementa a estratégia de identidade do 01 schema-dados.md
    - 'Testes cobrem EAN válido, SEM GTIN, ausente e fallback código+CNPJ'
    - 'pnpm test:unit verde'
    - Lógica não duplicada
  estimate: 2
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:18.218Z'
---
# resolveIdUnico() e utils de produto
