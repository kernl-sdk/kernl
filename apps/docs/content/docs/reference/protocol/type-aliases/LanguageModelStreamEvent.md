---
layout: docs
---

# Type Alias: LanguageModelStreamEvent

```ts
type LanguageModelStreamEvent = 
  | TextStartEvent
  | TextDeltaEvent
  | TextEndEvent
  | Message
  | ReasoningStartEvent
  | ReasoningDeltaEvent
  | ReasoningEndEvent
  | Reasoning
  | ToolInputStartEvent
  | ToolInputEndEvent
  | ToolInputDeltaEvent
  | ToolCall
  | ToolResult
  | StartEvent
  | FinishEvent
  | AbortEvent
  | ErrorEvent
  | RawEvent;
```

Defined in: [packages/protocol/src/language-model/stream.ts:13](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L13)

Union of all language model stream events.
