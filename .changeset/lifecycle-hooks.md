---
"kernl": minor
"@kernl-sdk/protocol": patch
"@kernl-sdk/ai": patch
---

Add lifecycle hooks for observing agent execution

- New events: `thread.start`, `thread.stop`, `model.call.start`, `model.call.end`, `tool.call.start`, `tool.call.end`
- Subscribe via `agent.on()` or `kernl.on()` for global hooks
- Fixed error propagation in thread execution
- Normalized `ErrorEvent.error` to always be an `Error` instance
