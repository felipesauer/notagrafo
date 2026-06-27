---
title: Protocolo de mutação no mnema (CLI vs MCP)
topics: ["mnema","workflow","tooling","reference"]
created_at: 2026-06-26T01:01:33.477Z
updated_at: 2026-06-26T01:01:33.477Z
---
Como criar artefatos no mnema do projeto NOTA (descoberto ao montar o planejamento):

- Toda sessão: context_bootstrap primeiro; envolver mutações MCP em agent_run_start/agent_run_end (sem run ativo → erro NO_ACTIVE_RUN).
- Epics e sprints: criados pela CLI `mnema epic create` / `mnema sprint plan` — NÃO há ferramenta MCP de criação (MCP só tem list/show/coverage/lint). Vincular task a epic é só CLI: `mnema epic add <EPIC-KEY> <TASK-KEY>`.
- Tasks: criar via MCP task_create (rastreável no run); vincular a sprint via MCP sprint_add_task; dependências via MCP task_depends_on(task, blocks_task) — task depende de blocks_task; submeter DRAFT→READY via task_submit (exige reenviar title+description+acceptance_criteria+estimate; description tem minLength 10).
- Assignee: task_create com assignee=<handle> FALHA com "FOREIGN KEY constraint failed" (parece esperar UUID, não handle); a CLI não tem comando de atribuição. Workaround: deixar sem assignee e sinalizar no título (ex.: prefixo [MANUAL]).
- Actor handle do Felipe no mnema: felipesauer (vem de MNEMA_ACTOR).
