---
mnema:
  key: NOTA-ADR-14
  kind: decision
  status: proposed
  title: Explorar como grupo de entidades no rail (não item único)
  context: >-
    Usuário pediu para 'Explorar ser um módulo tipo Análise que carrega
    notas/empresas/produtos/impostos/rede', mover Eventos para Sistema e Grafo
    para Geral. Havia duas formas: um item único 'Explorar' que abre o hub com
    abas, ou um grupo com sub-itens no rail.
  decision: >-
    No AppSidebar, o grupo ANÁLISE lista cada entidade do Explorer diretamente
    como item de menu — Notas Fiscais, Empresas, Produtos, Impostos, Rede —
    todos navegando para /explorar?entity=X. GERAL passa a ter Início e Grafo;
    SISTEMA passa a ter Eventos, Exportações, Configurações.
  rationale: >-
    Usuário escolheu explicitamente o grupo com sub-itens (acesso direto a cada
    entidade pelo rail, um clique). O Explorer já suporta troca por ?entity=,
    então cada item vira um deep-link. Rail mais longo, mas navegação mais
    direta.
  consequences: >-
    RAIL_GROUPS em AppSidebar.tsx reescrito; MobileNav (que reusa RAIL_GROUPS)
    acompanha. Item ativo precisa casar entity= via search para destacar
    corretamente. e2e app-sidebar revalidado.
  superseded_by: null
  authored_by: 019f0164-3101-76bc-af75-94e9b1380134
  impacts:
    - packages/dashboard/src/components/layout/AppSidebar.tsx
    - packages/dashboard/src/components/layout/MobileNav.tsx
    - NOTA-131
  metadata: {}
  at: '2026-07-06T16:21:32.350Z'
---
# Explorar como grupo de entidades no rail (não item único)
