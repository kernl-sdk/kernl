---
layout: docs
---

# Interface: RawEvent

Defined in: [packages/protocol/src/language-model/stream.ts:196](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L196)

Stream event containing raw provider-specific data.

## Extends

- [`StreamEventBase`](StreamEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `public` | `string` | The ID associated with this stream event. | [`StreamEventBase`](StreamEventBase.md).[`id`](StreamEventBase.md#id) | [packages/protocol/src/language-model/stream.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L40) |
| <a id="kind"></a> `kind` | `readonly` | `"raw"` | - | - | [packages/protocol/src/language-model/stream.ts:197](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L197) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | [`StreamEventBase`](StreamEventBase.md).[`providerMetadata`](StreamEventBase.md#providermetadata) | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
| <a id="rawvalue"></a> `rawValue` | `public` | `unknown` | The raw value from the provider. | - | [packages/protocol/src/language-model/stream.ts:202](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L202) |
