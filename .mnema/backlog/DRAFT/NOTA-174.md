---
mnema:
  key: NOTA-174
  state: DRAFT
  title: Export de tributos (ICMS/IPI/PIS/COFINS + IBS/CBS/IS) selecionáveis
  description: >-
    Hoje a exportação não inclui NENHUM tributo. Adicionar os totais de imposto
    como campos exportáveis, num novo grupo 'Tributos'. PASSOS: (a) graph:
    listInvoices/NFListItem passa a retornar os total_v* da NF (vICMS, vICMSST,
    vIPI, vPIS, vCOFINS, vFCP, vIBS, vIBSUF, vIBSMun, vCBS, vIS) — hoje o
    NFListItem só traz metadados; (b) api/export: flattenRow inclui esses
    campos; (c) dashboard Exports: novo grupo 'Tributos' nos GRUPOS de campos +
    i18n dos rótulos. Cuidar do CSV/XLSX (números com vírgula/BOM já tratados).
    Testes: listInvoices retorna total_v*, export serializa tributos.
  acceptance_criteria:
    - listInvoices/NFListItem retorna os total_v* de tributo
    - Export tem grupo 'Tributos' com ICMS..IS selecionáveis e preenchidos
    - i18n pt-BR/en dos campos
    - Testes (graph + export.service)
  labels:
    - dashboard
    - export
    - fiscal
    - graph
    - reforma
  estimate: 5
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T15:40:49.292Z'
---
# Export de tributos (ICMS/IPI/PIS/COFINS + IBS/CBS/IS) selecionáveis
