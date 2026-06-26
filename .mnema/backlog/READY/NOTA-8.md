---
mnema:
  key: NOTA-8
  state: READY
  title: Parser NFe (nfe.parser) + fixtures
  description: >-
    Criar nfe.parser.ts (extrai NF do XML para os tipos com fast-xml-parser; XSD
    como fonte de verdade; campos ausentes não viram null) e fixtures em
    __fixtures__/ (nfe-valida-v4.00.xml, nfe-invalida-schema.xml,
    nfe-cancelamento.xml, nfe-zip-multiplos.zip). Testes: completa, opcionais
    ausentes, devolução, cancelada.
  acceptance_criteria:
    - >-
      nfe.parser.ts extrai obrigatórios e opcionais presentes para os tipos do
      core
    - Campos ausentes não geram null/undefined
    - Fixtures criados conforme 04 infra-testes.md
    - 'Testes: completa, opcionais ausentes, devolução, cancelada — verdes'
  estimate: 5
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T00:55:22.098Z'
---
# Parser NFe (nfe.parser) + fixtures
