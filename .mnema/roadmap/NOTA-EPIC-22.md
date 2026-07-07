---
mnema:
  key: NOTA-EPIC-22
  kind: epic
  state: OPEN
  title: >-
    Fundamentos de UX (inspiração upcv-pro): enquadramento, Insights contextual,
    ritmo visual, PageHeader, EmptyState
  description: >-
    Usuário considera a UX 'quebrada num contexto amplo' e pediu para estudar o
    projeto upcv-pro como referência. Estudo (BRAND_MANUAL + design system em
    presentation/) + panorama do notagrafo revelaram: (1) painel Insights fixo
    em TODAS as telas (ruído em Grafo/Config/Exports); (2) conteúdo sem
    max-width (esparrama em telas largas); (3) espaço morto em Config/Exports;
    (4) espaçamento/tipografia ad-hoc sem ritmo; (5) estados vazios pobres; (6)
    sem PageHeader canônico. Rodada 1 (fundamentos, aprovada): enquadramento
    max-width POR TIPO de tela (dashboard=max-w-screen-xl,
    forms/config=max-w-2xl/3xl) com padding centralizado no shell; Insights SÓ
    na Home; escala de espaçamento semântica (gap-2/3/4/6/8) + tokens
    tipográficos (text-2xs/2sm); PageHeader canônico (título+subtítulo+ações);
    EmptyState rico (ícone+título+descrição+CTA). Base: branch
    feat/table-card-layout (TableCard já feito). upcv-pro é light-only — não
    copiar troca de tema, só estrutura.
  metadata: {}
  created_at: '2026-07-06T21:42:56.637Z'
  closed_at: null
---
# Fundamentos de UX (inspiração upcv-pro): enquadramento, Insights contextual, ritmo visual, PageHeader, EmptyState
