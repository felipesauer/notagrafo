---
mnema:
  key: NOTA-58
  state: IN_PROGRESS
  title: Fase 2 — Queries de agregação fiscal e cruzamento produto↔empresa (graph)
  description: >-
    Novas queries em packages/graph/src/queries/: (1) tax.queries.ts com
    taxSummary(filtros) — totais por tributo (usando props total_* do nó, Fase
    1b) + série mensal — e taxByNcm/taxByCfop (ranking de imposto agregado com
    descrição do catálogo). (2) productCompanies(idUnico) em product.queries.ts
    — empresas ligadas ao produto (emitente/destinatario) com totalNFs e valor.
    (3) getCompanyGraph ganha includeProdutos (nós de Produto do CNPJ raiz) e
    garante valorTotal nas arestas. Tudo parametrizado, DISTINCT onde MATCH
    multiplica. Exportar no index.
  acceptance_criteria:
    - >-
      taxSummary retorna totais por tributo + série mensal respeitando filtros
      de data/UF; taxByNcm/taxByCfop retornam ranking com descrição do catálogo
    - >-
      productCompanies(idUnico) retorna empresas ligadas ao produto com papel
      (emitente/destinatario), totalNFs e valor
    - >-
      getCompanyGraph com includeProdutos=true retorna nós de produto; arestas
      trazem valorTotal; testes unit (fake-driver) + integração verdes;
      cobertura graph >=90%
  estimate: 8
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T20:44:27.605Z'
---
# Fase 2 — Queries de agregação fiscal e cruzamento produto↔empresa (graph)
