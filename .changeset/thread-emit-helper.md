---
"kernl": patch
---

Add emit helper and sequence streamed events

- Thread now yields `ThreadEvent` with `seq` for complete items (messages, tool calls, tool results)
- Delta and control events remain ephemeral `StreamEvent` without seq
- Internal `emit()` helper reduces boilerplate in event emission
