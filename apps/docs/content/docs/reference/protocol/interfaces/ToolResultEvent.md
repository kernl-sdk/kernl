---
layout: docs
---

# Interface: ToolResultEvent

Defined in: [packages/protocol/src/realtime/events.ts:392](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L392)

Client event to submit a tool result.

## Extends

- [`RealtimeEventBase`](RealtimeEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="callid"></a> `callId` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:394](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L394) |
| <a id="error"></a> `error?` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:396](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L396) |
| <a id="id"></a> `id?` | `public` | `string` | Unique identifier for this event. | [`RealtimeEventBase`](RealtimeEventBase.md).[`id`](RealtimeEventBase.md#id) | [packages/protocol/src/realtime/events.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L19) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.result"` | - | - | [packages/protocol/src/realtime/events.ts:393](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L393) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [`RealtimeEventBase`](RealtimeEventBase.md).[`providerMetadata`](RealtimeEventBase.md#providermetadata) | [packages/protocol/src/realtime/events.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L24) |
| <a id="result"></a> `result?` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:395](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L395) |
