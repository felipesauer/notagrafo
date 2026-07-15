---
name: "handling-blockers"
version: 1.0.0
description: Mark and resolve tasks that depend on someone else.
tools_used: ["task_block","task_unblock"]
usage_count: 0
created_at: 2026-07-12T20:16:07.787Z
updated_at: 2026-07-12T20:16:07.787Z
---

# Handling blockers

When work cannot proceed because of an external dependency, do
not silently park the task — block it explicitly so the human
sees it in `mnema inbox`.

## Steps

1. `task_block({ task_key, reason })` — provide a concrete reason
   ("waiting for SSO credentials", not "blocked").
2. When the blocker is resolved, `task_unblock({ task_key, note })`
   so the audit log captures who unblocked and why.

## Example

`task_block({ task_key: "WEBAPP-7", reason: "missing AWS IAM access" })`

