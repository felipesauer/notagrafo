---
mnema:
  key: NOTA-8
  state: DONE
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
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-2
  sprint_key: NOTA-SPRINT-2
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T16:02:46.080Z'
---
# Parser NFe (nfe.parser) + fixtures
