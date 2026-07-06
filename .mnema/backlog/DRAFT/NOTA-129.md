---
mnema:
  key: NOTA-129
  state: DRAFT
  title: >-
    BUG: card Sistema (health) não carrega no dev — proxy /health ausente no
    Vite
  description: >-
    Usuário: 'Sistema não funciona' (Configurações mostra 'Ocorreu um erro').
    Causa raiz (subagente): fetchHealth faz fetch('/health') cru
    (Settings.tsx:23-26), fora do apiFetch (baseURL /api/v1). Em produção o
    nginx tem location /health (nginx.conf:18-22) → funciona. Em DEV o proxy do
    Vite só cobre /api (vite.config.ts:15-17), então /health cai no dev server
    (SPA) que devolve index.html com 200; res.json() explode em SyntaxError →
    InlineError. É bug só de dev. Correção: adicionar '/health' ao proxy do
    vite.config.ts (espelhar o nginx). Robustez opcional: fetchHealth tolerar
    503 (estado degraded) checando res.ok. O endpoint real é /health na raiz
    (fora do prefixo, app.ts:75-78) — shape não mudou.
  acceptance_criteria: []
  labels:
    - area:dashboard
    - tipo:bug
  estimate: 1
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:36.653Z'
---
# BUG: card Sistema (health) não carrega no dev — proxy /health ausente no Vite
