---
layout: docs
---

# Interface: Reasoning

Defined in: [packages/protocol/src/language-model/item.ts:135](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L135)

Reasoning that the model has generated.

## Extends

- [`LanguageModelItemBase`](LanguageModelItemBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `public` | `string` | A unique identifier for the item. Optional by default. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`id`](LanguageModelItemBase.md#id) | [packages/protocol/src/language-model/item.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L37) |
| <a id="kind"></a> `kind` | `readonly` | `"reasoning"` | - | - | [packages/protocol/src/language-model/item.ts:136](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L136) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`providerMetadata`](LanguageModelItemBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="text"></a> `text` | `public` | `string` | The reasoning content | - | [packages/protocol/src/language-model/item.ts:141](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L141) |
