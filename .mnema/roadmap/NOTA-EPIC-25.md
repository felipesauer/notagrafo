---
mnema:
  key: NOTA-EPIC-25
  kind: epic
  state: OPEN
  title: >-
    Melhorias do cenário da Reforma Tributária (export de tributos, filtros
    IBS/CBS, transição, CST)
  description: >-
    Follow-up do EPIC-24 (leitura de IBS/CBS/IS). 4 melhorias que aproveitam os
    tributos já extraídos, mantendo o escopo de ANÁLISE (não apuração/cálculo —
    fora do produto). (1) Export de tributos: hoje o export não inclui NENHUM
    imposto; adicionar ICMS/IPI/PIS/COFINS + IBS/CBS/IS como campos
    selecionáveis — exige listInvoices retornar os total_v* (hoje o NFListItem
    não os traz) + flatten + grupo 'Tributos' no dashboard. (2) Filtros IBS/CBS
    no Explorer: estender o filtro comImposto (hoje só total_vICMS>0) para
    IBS/CBS, permitindo recortar NF-e já sob a reforma. (3) Indicador de
    transição: KPI/card mostrando quantas NF-e já vêm com IBS/CBS/IS vs
    pré-reforma (período de convivência). (4) CST/cClassTrib no detalhe da NF: o
    backend já traz (getInvoice coleta a aresta CONTÉM com
    cstIBSCBS/cClassTrib); falta exibir na tela de detalhe. Planejamento only —
    implementação depois.
  metadata: {}
  created_at: '2026-07-07T15:40:13.502Z'
  closed_at: null
---
# Melhorias do cenário da Reforma Tributária (export de tributos, filtros IBS/CBS, transição, CST)
