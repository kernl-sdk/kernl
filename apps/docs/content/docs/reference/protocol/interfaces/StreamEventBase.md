---
layout: docs
---

# Interface: StreamEventBase

Defined in: [packages/protocol/src/language-model/stream.ts:36](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L36)

Base interface for all stream events.

## Extended by

- [`TextStartEvent`](TextStartEvent.md)
- [`TextEndEvent`](TextEndEvent.md)
- [`TextDeltaEvent`](TextDeltaEvent.md)
- [`ReasoningStartEvent`](ReasoningStartEvent.md)
- [`ReasoningEndEvent`](ReasoningEndEvent.md)
- [`ReasoningDeltaEvent`](ReasoningDeltaEvent.md)
- [`ToolInputStartEvent`](ToolInputStartEvent.md)
- [`ToolInputEndEvent`](ToolInputEndEvent.md)
- [`ToolInputDeltaEvent`](ToolInputDeltaEvent.md)
- [`StartEvent`](StartEvent.md)
- [`FinishEvent`](FinishEvent.md)
- [`AbortEvent`](AbortEvent.md)
- [`ErrorEvent`](ErrorEvent.md)
- [`RawEvent`](RawEvent.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `string` | The ID associated with this stream event. | [packages/protocol/src/language-model/stream.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L40) |
| <a id="providermetadata"></a> `providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
