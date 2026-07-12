---
name: "transitioning-tasks"
version: 1.0.0
description: Drive a task through the workflow with the appropriate transition tool.
tools_used: ["task_show","task_start","task_submit_review","task_approve"]
usage_count: 0
created_at: 2026-07-12T20:16:07.792Z
updated_at: 2026-07-12T20:16:07.792Z
---

# Transitioning tasks

Use this skill when an existing task needs to advance through the
workflow. Pick the right transition tool by reading `task_show`
first to confirm the current state.

## Steps

1. `task_show({ task_key })` — read the current state and `updated_at`.
2. Pick the correct `task_<action>` tool for the move (`task_start`,
   `task_submit_review`, `task_approve`, ...).
3. Pass `expected_updated_at` to detect concurrent edits when
   another agent or the human may have touched the task.

## Example

`task_submit_review({ task_key: "WEBAPP-1", pr_url: "https://github.com/x/y/pull/3" })`

