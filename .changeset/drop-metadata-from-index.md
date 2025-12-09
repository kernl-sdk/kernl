---
"kernl": patch
---

Drop metadata from search index projection

Metadata now lives only in the primary DB, not the search index. This fixes Turbopuffer serialization errors with nested objects and simplifies the index schema.
