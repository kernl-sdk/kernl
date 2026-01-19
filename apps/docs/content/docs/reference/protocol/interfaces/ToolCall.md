---
layout: docs
---

# Interface: ToolCall

Defined in: [packages/protocol/src/language-model/item.ts:197](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L197)

Tool calls that the model has generated.

## Extends

- [`LanguageModelItemBase`](LanguageModelItemBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="arguments"></a> `arguments` | `public` | `string` | The stringified JSON object with the arguments of the tool call. | - | [packages/protocol/src/language-model/item.ts:218](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L218) |
| <a id="callid"></a> `callId` | `public` | `string` | The identifier of the tool call. It must be unique across all tool calls. | - | [packages/protocol/src/language-model/item.ts:203](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L203) |
| <a id="id"></a> `id?` | `public` | `string` | A unique identifier for the item. Optional by default. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`id`](LanguageModelItemBase.md#id) | [packages/protocol/src/language-model/item.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L37) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.call"` | - | - | [packages/protocol/src/language-model/item.ts:198](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L198) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`providerMetadata`](LanguageModelItemBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="state"></a> `state` | `public` | [`ToolCallState`](../type-aliases/ToolCallState.md) | The state of the tool call. | - | [packages/protocol/src/language-model/item.ts:213](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L213) |
| <a id="toolid"></a> `toolId` | `public` | `string` | The id of the tool that should be called. | - | [packages/protocol/src/language-model/item.ts:208](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L208) |
