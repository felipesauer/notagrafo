---
mnema:
  key: NOTA-61
  state: IN_PROGRESS
  title: 'Fase 4a — Dashboard: impostos e NCM/CFOP no NFDetail'
  description: >-
    NFDetail.tsx: estender a interface Item para tributos + produto.ncm; colunas
    NCM, ICMS, IPI, PIS, COFINS na tabela de itens + linha/box de totais
    (consumindo a forma do GET /nf/:chave da Fase 3a). Exibir
    cfop{codigo,descricao} no bloco da NF. Atualizar tipos em api/hooks.ts e
    i18n (pt-BR/en). Domínio NF-e em PT (convenção do projeto).
  acceptance_criteria:
    - >-
      NFDetail exibe, por item, NCM e os tributos (ao menos ICMS/IPI/PIS/COFINS)
      e uma linha de totais da NF; CFOP com descrição visível
    - >-
      Tipos do dashboard refletem a resposta da Fase 3a; chaves i18n adicionadas
      nos 2 locales
    - Testes (unit/e2e onde aplicável) e build/lint verdes
  estimate: 5
  priority: 3
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f03ba-735c-725c-b52a-22a88c9abe61
  epic_key: NOTA-EPIC-11
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-06-29T22:36:13.948Z'
---
# Fase 4a — Dashboard: impostos e NCM/CFOP no NFDetail
