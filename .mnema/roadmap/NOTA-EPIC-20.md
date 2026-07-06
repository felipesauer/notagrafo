---
mnema:
  key: NOTA-EPIC-20
  kind: epic
  state: OPEN
  title: >-
    Consistência de tabelas/listagens + navegação do Explorer + ocupação de
    espaço
  description: >-
    Auditoria de UX/UI apontou que as listagens/tabelas do dashboard não seguem
    um padrão consistente e algumas não ocupam todo o espaço. Inventário mapeou
    8 listagens e 9 inconsistências (A-I): densidade aplicada em só 4/8 tabelas;
    data-testid divergente (Impostos usa 'chart'); sticky só no Explorer; clique
    de linha divergente (Notas abre peek, Últimas NFs não); ações inline
    duplicadas em 2 arquivos; ocupação de espaço (donut pequeno em card largo,
    Top NCM/CFOP em col-span-6 com slice 8, itens da NF espremidos);
    SortableHead órfão. Decisões do usuário: (1) padrão COMPLETO — uniformizar
    todas; (2) remover tabs de entidade no desktop, manter no mobile (rail vira
    drawer) + ajustar e2e; (3) clique de linha uniforme abrindo peek/detalhe.
    Inclui também o bug de ocupação do donut (Composição tributária) na Home.
    Base: branch feat/brand-logo (branding não mergeado na main).
  metadata: {}
  created_at: '2026-07-06T18:38:36.635Z'
  closed_at: null
---
# Consistência de tabelas/listagens + navegação do Explorer + ocupação de espaço
