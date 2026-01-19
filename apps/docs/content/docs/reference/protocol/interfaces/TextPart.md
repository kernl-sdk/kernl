---
layout: docs
---

# Interface: TextPart

Defined in: [packages/protocol/src/language-model/item.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L55)

Text that the model has generated.

## Extends

- [`PartBase`](PartBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `readonly` | `"text"` | - | - | [packages/protocol/src/language-model/item.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L56) |
| <a id="metadata"></a> `metadata?` | `public` | `Record`\<`string`, `unknown`\> | Optional metadata associated with this part. | [`PartBase`](PartBase.md).[`metadata`](PartBase.md#metadata) | [packages/protocol/src/language-model/item.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L49) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`PartBase`](PartBase.md).[`providerMetadata`](PartBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="text"></a> `text` | `public` | `string` | The text content. | - | [packages/protocol/src/language-model/item.ts:61](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L61) |
