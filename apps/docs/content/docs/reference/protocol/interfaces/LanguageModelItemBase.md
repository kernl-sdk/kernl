---
layout: docs
---

# Interface: LanguageModelItemBase

Defined in: [packages/protocol/src/language-model/item.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L33)

Shared base for language model items.

## Extends

- [`SharedBase`](SharedBase.md)

## Extended by

- [`Reasoning`](Reasoning.md)
- [`ToolCall`](ToolCall.md)
- [`ToolResult`](ToolResult.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id?` | `string` | A unique identifier for the item. Optional by default. | - | [packages/protocol/src/language-model/item.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L37) |
| <a id="providermetadata"></a> `providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`SharedBase`](SharedBase.md).[`providerMetadata`](SharedBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
