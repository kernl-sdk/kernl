---
layout: docs
---

# Interface: PartBase

Defined in: [packages/protocol/src/language-model/item.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L47)

Defines base properties common to all message or artifact parts.

## Extends

- [`SharedBase`](SharedBase.md)

## Extended by

- [`TextPart`](TextPart.md)
- [`DataPart`](DataPart.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | Optional metadata associated with this part. | - | [packages/protocol/src/language-model/item.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L49) |
| <a id="providermetadata"></a> `providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`SharedBase`](SharedBase.md).[`providerMetadata`](SharedBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
