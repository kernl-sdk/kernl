---
layout: docs
---

# Interface: DataPart

Defined in: [packages/protocol/src/language-model/item.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L121)

Represents a structured data segment (e.g., JSON) within a message or artifact.

## Extends

- [`PartBase`](PartBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `public` | `Record`\<`string`, `unknown`\> | The structured data content. | - | [packages/protocol/src/language-model/item.ts:127](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L127) |
| <a id="kind"></a> `kind` | `readonly` | `"data"` | - | - | [packages/protocol/src/language-model/item.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L122) |
| <a id="metadata"></a> `metadata?` | `public` | `Record`\<`string`, `unknown`\> | Optional metadata associated with this part. | [`PartBase`](PartBase.md).[`metadata`](PartBase.md#metadata) | [packages/protocol/src/language-model/item.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L49) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`PartBase`](PartBase.md).[`providerMetadata`](PartBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
