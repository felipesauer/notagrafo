---
mnema:
  key: NOTA-64
  state: DONE
  title: Fase 5 — Seed realista (impostos, multi-item, devolução) no worker
  description: >-
    generator.ts: gerar NFes com impostos realistas e coerentes (ICMS por CST —
    não só Simples zerado; IPI/PIS/COFINS; alguns com ICMS-ST/FCP), múltiplos
    itens por NF, variação de CST/CFOP/NCM (mais entradas no catálogo de
    produtos), e suporte a NF de DEVOLUÇÃO (finNFe=4, tpNF=0, CFOP devolução,
    NFref/refNFe). runSeed acumula chaves e a cada N notas gera uma devolução
    referenciando uma anterior. Manter validade XSD v4.00 e determinismo.
    Atualizar testes (generator.test/seed.test).
  acceptance_criteria:
    - >-
      Seed gera NFes válidas no XSD v4.00 com impostos não-zero variados,
      multi-item e diferentes CST/CFOP/NCM
    - >-
      Pelo menos algumas NFes de devolução referenciam outras via refNFe,
      produzindo arestas DEVOLVE após o processamento
    - >-
      Após rodar o seed numa stack limpa, /stats/impostos e a página de Impostos
      exibem valores não-zero; testes do seed verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-30T00:49:45.657Z'
---
# Fase 5 — Seed realista (impostos, multi-item, devolução) no worker
