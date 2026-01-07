---
"kernl": minor
---

Add multi-agent handoff orchestration via `Kernl.run()` method

- Agents can delegate to other registered agents using a built-in `handoff` tool
- `Kernl.run(agentId, input, options)` orchestrates agent execution with automatic handoff support
- Configurable `maxHandoffs` limit (default: 10) prevents infinite handoff loops
- `agent_handoff` lifecycle hook emitted on each handoff for observability
- New types: `HandoffResult`, `HandoffRecord`, `HandoffRunResult`, `KernlRunOptions`
- New error: `MaxHandoffsExceededError` thrown when handoff limit exceeded
