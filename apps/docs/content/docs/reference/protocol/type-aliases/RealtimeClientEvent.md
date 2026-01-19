---
layout: docs
---

# Type Alias: RealtimeClientEvent

```ts
type RealtimeClientEvent = 
  | SessionUpdateEvent
  | ItemCreateEvent
  | ItemDeleteEvent
  | ItemTruncateEvent
  | AudioInputAppendEvent
  | AudioInputCommitEvent
  | AudioInputClearEvent
  | ActivityStartEvent
  | ActivityEndEvent
  | ResponseCreateEvent
  | ResponseCancelEvent
  | ToolResultEvent;
```

Defined in: [packages/protocol/src/realtime/events.ts:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L30)

Union of all client → server events.
