---
layout: docs
---

# Type Alias: RealtimeServerEvent

```ts
type RealtimeServerEvent = 
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionErrorEvent
  | ItemCreatedEvent
  | ItemDeletedEvent
  | ItemTruncatedEvent
  | AudioInputCommittedEvent
  | AudioInputClearedEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | AudioOutputDeltaEvent
  | AudioOutputDoneEvent
  | TextOutputDeltaEvent
  | TextOutputEvent
  | TranscriptInputDeltaEvent
  | TranscriptInputEvent
  | TranscriptOutputDeltaEvent
  | TranscriptOutputEvent
  | ResponseCreatedEvent
  | ResponseInterruptedEvent
  | ResponseDoneEvent
  | ToolStartEvent
  | ToolDeltaEvent
  | ToolCallEvent
  | ToolCancelledEvent;
```

Defined in: [packages/protocol/src/realtime/events.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L47)

Union of all server → client events.
