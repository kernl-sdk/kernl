---
layout: docs
---

# Type Alias: ThreadEvent

```ts
type ThreadEvent = LanguageModelItem & ThreadEventBase;
```

Defined in: [packages/kernl/src/api/models/thread.ts:138](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/models/thread.ts#L138)

Thread event as returned by APIs like `kernl.threads.history()`.

This is a `LanguageModelItem` (message, tool-call, tool-result, etc.)
enriched with thread-specific metadata such as `tid` and `seq`.

Internal system events are filtered out before exposing this type.
