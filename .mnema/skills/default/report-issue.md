---
name: "report-issue"
version: 1.0.0
description: Assemble a sanitized bug report from the local error log and doctor; the human opens the issue.
tools_used: ["audit_verify"]
usage_count: 0
created_at: 2026-07-12T20:16:07.791Z
updated_at: 2026-07-12T20:16:07.791Z
---

# Report an issue

Use this when the user hit a crash or unexpected behaviour and wants
to report it. Turn what the machine already recorded into a clean,
sanitized bug report instead of the user hand-copying stack traces.

An unhandled crash is appended to a LOCAL, never-transmitted error log
at `.mnema/state/errors.jsonl` (zero-telemetry — it stays on the
machine). Each line is JSON: `{ at, message, stack, mnema_version,
node_version, argv }`. Expected errors (gate failed, conflict) are NOT
there — only genuine crashes.

## Steps

1. Read the most recent crash from `.mnema/state/errors.jsonl`. If the
   file is absent, the crash predates this or happened outside a
   project — ask the user to re-run with `MNEMA_DEBUG=1` and paste the
   stack.
2. SANITIZE before showing anything: home directory to `~`, any other
   absolute path down to its basename, `KEY=value` where the key looks
   secret-shaped to `KEY=<redacted>`, and long opaque tokens to
   `<redacted>`.
3. Gather environment: `mnema --version` and the log entry’s
   `node_version`; a sanitized `mnema doctor` summary.
4. Fill `.github/ISSUE_TEMPLATE/bug_report.md` — Version, Steps to
   reproduce (ask the user; the log has `argv`, not intent), Expected
   vs actual (the sanitized message/stack).
5. Show the assembled report and open it with `gh issue create` ONLY
   after explicit confirmation — never file automatically.

## Example

User: "Mnema crashed when I ran sync." Read the last `errors.jsonl`
entry, redact its stack, and draft the bug report for the user to
review before `gh issue create`.

