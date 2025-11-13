---
"kernl": minor
---

Refactor thread execution to support streaming and fix tool schema serialization. Adds new `stream()` method for async iteration over thread events, fixes tool parameter schemas to use JSON Schema instead of raw Zod schemas.
