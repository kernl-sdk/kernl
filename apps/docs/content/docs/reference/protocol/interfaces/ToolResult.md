---
layout: docs
---

# Interface: ToolResult

Defined in: [packages/protocol/src/language-model/item.ts:224](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L224)

Result of a tool call that has been executed by the provider.

## Extends

- [`LanguageModelItemBase`](LanguageModelItemBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="callid"></a> `callId` | `public` | `string` | The ID of the tool call that this result is associated with. | - | [packages/protocol/src/language-model/item.ts:230](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L230) |
| <a id="error"></a> `error` | `public` | `string` \| `null` | Error message if the tool call failed | - | [packages/protocol/src/language-model/item.ts:250](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L250) |
| <a id="id"></a> `id?` | `public` | `string` | A unique identifier for the item. Optional by default. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`id`](LanguageModelItemBase.md#id) | [packages/protocol/src/language-model/item.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L37) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.result"` | - | - | [packages/protocol/src/language-model/item.ts:225](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L225) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`LanguageModelItemBase`](LanguageModelItemBase.md).[`providerMetadata`](LanguageModelItemBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="result"></a> `result` | `public` | [`JSONValue`](../type-aliases/JSONValue.md) | Result of the tool call. This is a JSON-serializable object. | - | [packages/protocol/src/language-model/item.ts:245](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L245) |
| <a id="state"></a> `state` | `public` | [`ToolCallState`](../type-aliases/ToolCallState.md) | The state of the tool call. | - | [packages/protocol/src/language-model/item.ts:240](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L240) |
| <a id="toolid"></a> `toolId` | `public` | `string` | Name of the tool that generated this result. | - | [packages/protocol/src/language-model/item.ts:235](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L235) |
