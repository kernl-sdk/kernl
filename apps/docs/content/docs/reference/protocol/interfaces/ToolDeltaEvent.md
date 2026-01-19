---
layout: docs
---

# Interface: ToolDeltaEvent

Defined in: [packages/protocol/src/realtime/events.ts:365](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L365)

Server event containing a tool call arguments chunk.

## Extends

- [`RealtimeEventBase`](RealtimeEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="callid"></a> `callId` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:367](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L367) |
| <a id="delta"></a> `delta` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:368](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L368) |
| <a id="id"></a> `id?` | `public` | `string` | Unique identifier for this event. | [`RealtimeEventBase`](RealtimeEventBase.md).[`id`](RealtimeEventBase.md#id) | [packages/protocol/src/realtime/events.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L19) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.delta"` | - | - | [packages/protocol/src/realtime/events.ts:366](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L366) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [`RealtimeEventBase`](RealtimeEventBase.md).[`providerMetadata`](RealtimeEventBase.md#providermetadata) | [packages/protocol/src/realtime/events.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L24) |
