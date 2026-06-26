---
mnema:
  key: NOTA-7
  state: DONE
  title: Validador XSD (nfe.validator + xsd.registry)
  description: >-
    Criar nfe.validator.ts (valida XML contra XSD oficial via libxmljs2, sem
    reimplementar regras) e xsd.registry.ts (mapeia versaoSchema → caminho do
    XSD). XML inválido → erro; versão sem XSD → erro claro de versão não
    suportada. Testes: válido v3.10/v4.00, inválido, versão desconhecida.
  acceptance_criteria:
    - nfe.validator.ts valida via libxmljs2 contra o XSD da versão declarada
    - xsd.registry.ts resolve versão→XSD e detecta versão não suportada
    - Erro de versão desconhecida com mensagem clara
    - 'Testes: válido v3.10/v4.00, inválido, versão desconhecida — verdes'
  estimate: 3
  priority: 1
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-2
  sprint_key: NOTA-SPRINT-2
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-26T15:54:50.622Z'
---
# Validador XSD (nfe.validator + xsd.registry)
