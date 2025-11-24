---
"@kernl-sdk/core": minor
"@kernl-sdk/storage": patch
"@kernl-sdk/pg": patch
---

Introduce the public Kernl threads API surface (`kernl.threads` and
`agent.threads`) for listing, getting, deleting, and reading history, backed
by simple `Thread` and `ThreadEvent` models.

Add explicit thread creation and update APIs, including first-class `title`
support (stored in `metadata.title`) and structured `context` / `metadata`
patch semantics, and tighten thread persistence behavior in core + storage
implementations to keep context and metadata consistent across in-memory and
Postgres stores.
