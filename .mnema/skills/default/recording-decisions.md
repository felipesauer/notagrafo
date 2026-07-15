---
name: "recording-decisions"
version: 1.0.0
description: Capture architectural decisions as durable ADRs.
tools_used: ["decision_record","decision_show","decisions_list"]
usage_count: 0
created_at: 2026-07-12T20:16:07.790Z
updated_at: 2026-07-12T20:16:07.790Z
---

# Recording decisions

When the agent makes a non-obvious architectural choice, capture
it as an ADR so the next session does not relitigate it. Use the
`decision_record` MCP tool — it stores the ADR in SQLite, indexes
it for FTS, and routes the proposed status into the inbox so a
human can accept or reject it.

## Steps

1. Call `decision_record({ title, decision, context?, rationale?, consequences? })`.
2. The tool returns the new ADR with its key (e.g. `MYAPP-ADR-7`).
3. Reference the key from related tasks or future decisions.

## Example

```
# ADR-0007 — Use Zod for runtime validation

## Context
The project needs runtime validation for both config and user input.

## Decision
Adopt Zod 4. 

## Consequences
Positive: type-safe, single source of truth.
Negative: bundle size grows by ~50KB.
```

