---
"@kernl-sdk/core": patch
---

Add clean public API for thread management with ThreadsResource class and agent-scoped thread access. Users can now access threads via `kernl.threads.get/list/delete/history()` or use agent-scoped helpers like `agent.threads.list()` that automatically filter to that agent's threads.
