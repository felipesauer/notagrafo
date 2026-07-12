---
description: Review a task before closing it — its evidence and current state.
steps:
  - task show
  - task evidence
---

# /close

Before moving a task to done, confirm it carries the evidence that
proves each acceptance criterion. Pass the task key to each step,
e.g. `mnema task show WEBAPP-4`. Then approve it with a note via
`mnema task move <key> approve --field approval_note="..."`.
