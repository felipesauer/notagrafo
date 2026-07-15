---
name: "creating-tasks"
version: 1.0.0
description: "Decompose a request into well-scoped tasks before writing code."
tools_used: ["agent_run_start","task_create","task_submit"]
usage_count: 0
created_at: 2026-07-12T20:16:07.760Z
updated_at: 2026-07-12T20:16:07.760Z
---

# Creating tasks

Use this skill when the agent needs to decompose a user request into
one or more tasks before any code change.

## Steps

1. Call `agent_run_start` if you have not already.
2. For each unit of work, call `task_create` with a precise
   title and description.
3. When the task is fully scoped, transition it to the next state
   with `task_submit` providing acceptance criteria and an estimate.

## Example

User: "Add Google sign-in to the web app."

1. `agent_run_start({ goal: "scope Google sign-in" })`
2. `task_create({ title: "Wire up OAuth callback" })`
3. `task_submit({ task_key: "WEBAPP-1", title: "...", description: "...",
   acceptance_criteria: ["redirect lands on /auth/callback"], estimate: 5 })`

