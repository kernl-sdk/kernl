---
"kernl": minor
---

Add memory system tools and agents public API

- Add system tools infrastructure (`agent.systools`) for built-in agent capabilities
- Add memory toolkit with `memories.search`, `memories.create`, `memories.list` tools
- Add `memory: { enabled: true }` agent config to enable memory tools
- Add `ctx.agent` reference for tools to access agent APIs
- Add `kernl.agents` public API with `get`, `list`, `has`, `unregister` methods
- Add `Memory.list()` method for listing memories with filters
- Add `agent.description` field for agent metadata
- Fix: exclude metadata from thread checkpoint to prevent race conditions
