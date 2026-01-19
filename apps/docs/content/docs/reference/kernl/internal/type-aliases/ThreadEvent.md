---
layout: docs
---

# Type Alias: ThreadEvent

```ts
type ThreadEvent = 
  | LanguageModelItem & ThreadEventBase
  | ThreadSystemEvent;
```

Defined in: [packages/kernl/src/thread/types.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L140)

Thread events are append-only log entries ordered by seq.

Events extend LanguageModelItem types with thread-specific metadata (tid, seq, timestamp).
When sent to the model, we extract the LanguageModelItem by omitting the base fields.
