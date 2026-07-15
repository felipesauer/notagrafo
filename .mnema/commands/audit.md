---
description: Audit the current change — commits with no task, and the audit-chain integrity.
steps:
  - drift
  - audit verify
---

# /audit

Check that the work is on the rails: `drift` lists commits on this
branch not tied to any task, and `audit verify` confirms the
hash-chained log is intact. Both read-only.
