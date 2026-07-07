---
mnema:
  key: NOTA-EPIC-24
  kind: epic
  state: CLOSED
  title: 'Reforma Tributária na NF-e: leitura e análise de IBS, CBS e IS'
  description: >-
    Suporte à Reforma Tributária (LC 214/2025, NT 2025.002) por leitura —
    extrair os novos tributos do XML, modelar no grafo e expor no dashboard,
    como já é feito com ICMS/IPI/PIS/COFINS. O XSD v4.00 em disco já valida os
    grupos (gIBSCBS/TCIBS, IBSCBSTot/TIBSCBSMonoTot, ISTot/TISTot). Escopo: (1)
    tipos+parser dos grupos gIBSCBS (item) e totais IBSCBSTot/ISTot —
    vIBS/vIBSUF/vIBSMun/vCBS/vIS/cClassTrib, tolerante (opcional); (2) grafo:
    novos total_v* no nó NotaFiscal; (3) API: tax.queries agrega IBS/CBS/IS na
    composição e série; (4) dashboard: composição tributária, filtros de imposto
    e export ganham IBS/CBS/IS; (5) seed de demo gera NF-e com o grupo da
    reforma para testar. Ver ADR-18.
  metadata: {}
  created_at: '2026-07-07T15:07:58.485Z'
  closed_at: '2026-07-07T16:25:13.210Z'
---
# Reforma Tributária na NF-e: leitura e análise de IBS, CBS e IS
