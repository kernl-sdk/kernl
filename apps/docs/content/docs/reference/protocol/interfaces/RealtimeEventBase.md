---
layout: docs
---

# Interface: RealtimeEventBase

Defined in: [packages/protocol/src/realtime/events.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L15)

Base interface for all realtime events.

## Extended by

- [`SessionUpdateEvent`](SessionUpdateEvent.md)
- [`ItemCreateEvent`](ItemCreateEvent.md)
- [`ItemDeleteEvent`](ItemDeleteEvent.md)
- [`ItemTruncateEvent`](ItemTruncateEvent.md)
- [`AudioInputAppendEvent`](AudioInputAppendEvent.md)
- [`AudioInputCommitEvent`](AudioInputCommitEvent.md)
- [`AudioInputClearEvent`](AudioInputClearEvent.md)
- [`ActivityStartEvent`](ActivityStartEvent.md)
- [`ActivityEndEvent`](ActivityEndEvent.md)
- [`ResponseCreateEvent`](ResponseCreateEvent.md)
- [`ResponseCancelEvent`](ResponseCancelEvent.md)
- [`SessionCreatedEvent`](SessionCreatedEvent.md)
- [`SessionUpdatedEvent`](SessionUpdatedEvent.md)
- [`SessionErrorEvent`](SessionErrorEvent.md)
- [`ItemCreatedEvent`](ItemCreatedEvent.md)
- [`ItemDeletedEvent`](ItemDeletedEvent.md)
- [`ItemTruncatedEvent`](ItemTruncatedEvent.md)
- [`AudioInputCommittedEvent`](AudioInputCommittedEvent.md)
- [`AudioInputClearedEvent`](AudioInputClearedEvent.md)
- [`SpeechStartedEvent`](SpeechStartedEvent.md)
- [`SpeechStoppedEvent`](SpeechStoppedEvent.md)
- [`AudioOutputDeltaEvent`](AudioOutputDeltaEvent.md)
- [`AudioOutputDoneEvent`](AudioOutputDoneEvent.md)
- [`TextOutputDeltaEvent`](TextOutputDeltaEvent.md)
- [`TextOutputEvent`](TextOutputEvent.md)
- [`TranscriptInputDeltaEvent`](TranscriptInputDeltaEvent.md)
- [`TranscriptInputEvent`](TranscriptInputEvent.md)
- [`TranscriptOutputDeltaEvent`](TranscriptOutputDeltaEvent.md)
- [`TranscriptOutputEvent`](TranscriptOutputEvent.md)
- [`ResponseCreatedEvent`](ResponseCreatedEvent.md)
- [`ResponseInterruptedEvent`](ResponseInterruptedEvent.md)
- [`ResponseDoneEvent`](ResponseDoneEvent.md)
- [`ToolStartEvent`](ToolStartEvent.md)
- [`ToolDeltaEvent`](ToolDeltaEvent.md)
- [`ToolCallEvent`](ToolCallEvent.md)
- [`ToolCancelledEvent`](ToolCancelledEvent.md)
- [`ToolResultEvent`](ToolResultEvent.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `string` | Unique identifier for this event. | [packages/protocol/src/realtime/events.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L19) |
| <a id="providermetadata"></a> `providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [packages/protocol/src/realtime/events.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L24) |
