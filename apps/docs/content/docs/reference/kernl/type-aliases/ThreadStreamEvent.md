---
layout: docs
---

# Type Alias: ThreadStreamEvent

```ts
type ThreadStreamEvent = ThreadEvent | StreamEvent;
```

Defined in: [packages/kernl/src/thread/types.ts:179](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L179)

Thread stream events = sequenced ThreadEvents + ephemeral StreamEvents.

Complete items (Message, ToolCall, etc.) are yielded as ThreadEvents with seq.
Deltas and control events are yielded as StreamEvents without seq.
