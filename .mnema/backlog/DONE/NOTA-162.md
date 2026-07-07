---
mnema:
  key: NOTA-162
  state: DONE
  title: 'Fix: dedupe react/react-dom no Vite (useContext null intermitente no dev)'
  description: >-
    Reportado pelo usuário: erro intermitente no dev 'Cannot read properties of
    null (reading useContext)' que sumia ao recarregar a página. Diagnóstico: só
    1 versão física de React → causa é instância dupla via symlink pnpm no Vite
    dev. Corrigido com resolve.dedupe:['react','react-dom'] +
    optimizeDeps.include no vite.config. Verificado: tsc limpo + 6 ciclos de HMR
    sem o erro.
  acceptance_criteria:
    - resolve.dedupe react/react-dom
    - optimizeDeps.include react/react-dom/client/jsx-runtime
    - tsc limpo
    - HMR sem useContext null nos ciclos testados
  labels:
    - bug
    - dashboard
    - dx
    - vite
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:04:44.268Z'
---
# Fix: dedupe react/react-dom no Vite (useContext null intermitente no dev)
