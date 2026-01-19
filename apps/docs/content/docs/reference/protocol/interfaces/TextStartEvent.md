---
layout: docs
---

# Interface: TextStartEvent

Defined in: [packages/protocol/src/language-model/stream.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L51)

Stream event indicating the start of a text output.

## Extends

- [`StreamEventBase`](StreamEventBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `public` | `string` | The ID associated with this stream event. | [`StreamEventBase`](StreamEventBase.md).[`id`](StreamEventBase.md#id) | - | [packages/protocol/src/language-model/stream.ts:53](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L53) |
| <a id="kind"></a> `kind` | `readonly` | `"text.start"` | - | - | - | [packages/protocol/src/language-model/stream.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L52) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | - | [`StreamEventBase`](StreamEventBase.md).[`providerMetadata`](StreamEventBase.md#providermetadata) | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
