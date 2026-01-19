---
layout: docs
---

# Interface: ResponseCreatedEvent

Defined in: [packages/protocol/src/realtime/events.ts:329](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L329)

Server event indicating a response has been created.

## Extends

- [`RealtimeEventBase`](RealtimeEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `public` | `string` | Unique identifier for this event. | [`RealtimeEventBase`](RealtimeEventBase.md).[`id`](RealtimeEventBase.md#id) | [packages/protocol/src/realtime/events.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L19) |
| <a id="kind"></a> `kind` | `readonly` | `"response.created"` | - | - | [packages/protocol/src/realtime/events.ts:330](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L330) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [`RealtimeEventBase`](RealtimeEventBase.md).[`providerMetadata`](RealtimeEventBase.md#providermetadata) | [packages/protocol/src/realtime/events.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L24) |
| <a id="responseid"></a> `responseId` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:331](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L331) |
