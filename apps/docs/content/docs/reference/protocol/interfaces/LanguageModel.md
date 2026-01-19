---
layout: docs
---

# Interface: LanguageModel

Defined in: [packages/protocol/src/language-model/model.ts:11](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L11)

Defines the standard interface for language model providers in kernl.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="modelid"></a> `modelId` | `readonly` | `string` | Provider-specific model ID. | [packages/protocol/src/language-model/model.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L25) |
| <a id="provider"></a> `provider` | `readonly` | `string` | Provider ID. | [packages/protocol/src/language-model/model.ts:20](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L20) |
| <a id="spec"></a> `spec` | `readonly` | `"1.0"` | The language model must specify which language model interface version it implements. | [packages/protocol/src/language-model/model.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L15) |

## Methods

### generate()

```ts
generate(request: LanguageModelRequest): Promise<LanguageModelResponse>;
```

Defined in: [packages/protocol/src/language-model/model.ts:32](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L32)

Get a response from the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `request` | [`LanguageModelRequest`](LanguageModelRequest.md) | The request to get a response for. |

#### Returns

`Promise`\<[`LanguageModelResponse`](LanguageModelResponse.md)\>

***

### stream()

```ts
stream(request: LanguageModelRequest): AsyncIterable<LanguageModelStreamEvent>;
```

Defined in: [packages/protocol/src/language-model/model.ts:39](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L39)

Get a streamed response from the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `request` | [`LanguageModelRequest`](LanguageModelRequest.md) | The request to get a response for. |

#### Returns

`AsyncIterable`\<[`LanguageModelStreamEvent`](../type-aliases/LanguageModelStreamEvent.md)\>
