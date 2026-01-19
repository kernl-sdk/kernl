---
layout: docs
---

# Interface: TextOutputEvent

Defined in: [packages/protocol/src/realtime/events.ts:281](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L281)

Server event containing the complete text output.

## Extends

- [`RealtimeEventBase`](RealtimeEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `public` | `string` | Unique identifier for this event. | [`RealtimeEventBase`](RealtimeEventBase.md).[`id`](RealtimeEventBase.md#id) | [packages/protocol/src/realtime/events.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L19) |
| <a id="itemid"></a> `itemId` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:284](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L284) |
| <a id="kind"></a> `kind` | `readonly` | `"text.output"` | - | - | [packages/protocol/src/realtime/events.ts:282](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L282) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [`RealtimeEventBase`](RealtimeEventBase.md).[`providerMetadata`](RealtimeEventBase.md#providermetadata) | [packages/protocol/src/realtime/events.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L24) |
| <a id="responseid"></a> `responseId` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:283](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L283) |
| <a id="text"></a> `text` | `public` | `string` | - | - | [packages/protocol/src/realtime/events.ts:285](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/events.ts#L285) |
