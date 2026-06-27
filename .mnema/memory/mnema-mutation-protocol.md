---
title: "Protocolo de mutação no mnema (atualizado p/ 0.7.0-alpha)"
topics: ["mnema","workflow","tooling","reference"]
created_at: 2026-06-26T01:01:33.477Z
updated_at: 2026-06-26T23:02:56.696Z
---
Protocolo de mutação no mnema do projeto NOTA (revisado no upgrade para 0.7.0-alpha):

- **Toda sessão:** context_bootstrap primeiro; envolver mutações em agent_run_start/agent_run_end (sem run → NO_ACTIVE_RUN).
- **Roadmap agora é todo via MCP** (mudou no 0.7): epic_create/epic_add_task, sprint_create/sprint_add_task(s) e as decision tools fluem pelo run ativo — NÃO precisa mais cair na CLI. Para planos grandes, preferir os batch tools task_create_many, sprint_add_tasks, task_depends_many (tentam item a item e reportam falhas por item).
- **Tasks:** task_create / task_create_many; sprint_add_task(s); dependências via task_depends_on / task_depends_many; submeter DRAFT→READY via task_submit (exige title+description+AC+estimate; description minLength 10).
- **task_start** aceita handle no assignee_id (resolve/cria actor). Já task_create com assignee handle falhava (FK) — usar task_start para atribuir.
- **task_approve exige approval_note** (obrigatório). Enforcement é strict: gate sem campo obrigatório bloqueia o agente; só humano força (e fica auditado). Não contornar gate, preencher os campos.
- **Conhecimento durável vai no mnema, não na memória nativa:** memory_record (upsert por slug), skill_record (+skill_use ao aplicar), observation_record (fire-and-forget), decision_record (ADR). Tudo espelhado em .md no repo + log hash-chained.
- **agent_run_resume(run_id):** reanexa a run interrompida (aborted/failed) em vez de abrir nova; no-op se ainda rodando, rejeita se completed.
- Actor handle do Felipe: felipesauer (de MNEMA_ACTOR).
