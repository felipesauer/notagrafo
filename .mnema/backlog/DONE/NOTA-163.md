---
mnema:
  key: NOTA-163
  state: DONE
  title: 'Exportação: campos ricos agrupados + fix do toast persistente'
  description: >-
    A tela de Exportações só oferecia 6 campos fixos, embora
    listInvoices/flattenRow já produzam ~19. Expõe todos, agrupados
    (Identificação/Valores/Datas/Emitente/Destinatário) com marcar/desmarcar por
    grupo + todos global + contador. Seleção inicial = os 6 essenciais. Backend
    inalterado. Também corrige bug reportado: o toast 'exportação pronta' tinha
    duration:Infinity e nunca saía — agora duração finita (15s), clicar em
    Baixar baixa E fecha (toast.dismiss), onAutoClose/onDismiss limpam o job.
    i18n pt-BR/en. tsc+lint+286 unit verdes.
  acceptance_criteria:
    - Todos os ~19 campos selecionáveis, agrupados
    - Marcar/desmarcar por grupo + todos global
    - Toast sai sozinho e fecha ao clicar em Baixar
    - i18n pt-BR/en
    - tsc+lint+unit verdes
  labels:
    - dashboard
    - export
    - ux
  estimate: 3
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:25:09.826Z'
---
# Exportação: campos ricos agrupados + fix do toast persistente
