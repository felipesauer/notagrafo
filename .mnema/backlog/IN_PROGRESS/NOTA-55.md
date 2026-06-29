---
mnema:
  key: NOTA-55
  state: IN_PROGRESS
  title: Fase 0 — Catálogo NCM/CFOP em @notagrafo/core
  description: >-
    Criar um catálogo enxuto e versionado de NCM (por capítulo, 2 dígitos) e
    CFOP (códigos comuns) em packages/core, para popular
    descricao/secao/capitulo (NCM) e descricao/tipo/natureza (CFOP) nos nós do
    grafo. Catálogo estático (sem fetch em runtime — coerente com a regra dos
    XSDs). lookupCfop infere `tipo` pelo 1º dígito (1/2/3=entrada, 5/6/7=saida).
    NÃO altera o grafo ainda — só os dados + lookups + testes.
  acceptance_criteria:
    - >-
      lookupNcm(codigo) retorna {descricao,secao,capitulo} para um conjunto de
      capítulos NCM cobrindo os usados no seed e casos comuns; retorna ao menos
      capitulo (2 primeiros dígitos) para NCM desconhecido
    - >-
      lookupCfop(codigo) retorna {descricao,tipo,natureza} para os CFOPs comuns
      (ex.: 5101,5102,5403,6102,1102,2102) e infere tipo pelo 1º dígito para
      CFOP fora da tabela
    - >-
      Testes unit cobrem código conhecido, desconhecido e inferência de tipo;
      build/typecheck/lint verdes; cobertura do core mantida >=90%
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T20:09:26.155Z'
---
# Fase 0 — Catálogo NCM/CFOP em @notagrafo/core
