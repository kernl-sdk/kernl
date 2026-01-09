---
"kernl": patch
---

Fix lifecycle event architecture: Thread now owns all lifecycle events and emits via agent for uniform observability

- Move thread.start/stop emissions from Kernl to Thread.stream()
- Both agent.on() and kernl.on() now receive all lifecycle events
- Remove redundant outcome field from ThreadStopEvent (use result/error instead)
- Fix: schedule() was missing thread events, agent.on("thread.*") never fired
