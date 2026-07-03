---
title: "Usar o MCP mnema (estável do npm), não mnema-dev"
topics: ["mnema","tooling","workflow","reference"]
created_at: 2026-07-03T21:56:57.172Z
updated_at: 2026-07-03T21:56:57.172Z
---
Há dois MCP servers de mnema conectáveis nesta máquina: **mnema** (o pacote estável publicado no npm, @felipesauer/mnema) e **mnema-dev** (o projeto em desenvolvimento, à frente do npm, com features ainda em teste). SEMPRE usar o `mnema` estável para o tracking do projeto notagrafo. O `mnema-dev` é para desenvolver o próprio mnema — e é ele que dava erro SCHEMA_OUT_OF_DATE nas mutações (features instáveis). Nas Fases 1–4 do redesign eu errei mirando no mnema-dev e caí em fallback pela CLI; o correto era o MCP `mnema`. A partir da Fase 5 (EPIC-17) o tracking usa o MCP `mnema` normalmente (agent_run_start → mutações → agent_run_end). Se `mcp__mnema__*` sumir, aí sim a CLI `mnema` é o fallback.
