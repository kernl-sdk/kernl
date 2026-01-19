---
layout: docs
---

# Interface: TextDeltaEvent

Defined in: [packages/protocol/src/language-model/stream.ts:67](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L67)

Stream event containing a delta (chunk) of text output.

## Extends

- [`StreamEventBase`](StreamEventBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `public` | `string` | The ID associated with this stream event. | [`StreamEventBase`](StreamEventBase.md).[`id`](StreamEventBase.md#id) | - | [packages/protocol/src/language-model/stream.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L69) |
| <a id="kind"></a> `kind` | `readonly` | `"text.delta"` | - | - | - | [packages/protocol/src/language-model/stream.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L68) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | - | [`StreamEventBase`](StreamEventBase.md).[`providerMetadata`](StreamEventBase.md#providermetadata) | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
| <a id="text"></a> `text` | `public` | `string` | The incremental text chunk. | - | - | [packages/protocol/src/language-model/stream.ts:74](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L74) |
