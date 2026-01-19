---
layout: docs
---

# Interface: FinishEvent

Defined in: [packages/protocol/src/language-model/stream.ts:160](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L160)

Stream event indicating the completion of agent execution.

## Extends

- [`StreamEventBase`](StreamEventBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="finishreason"></a> `finishReason` | `public` | [`LanguageModelFinishReason`](LanguageModelFinishReason.md) | The reason for completion. | - | [packages/protocol/src/language-model/stream.ts:166](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L166) |
| <a id="id"></a> `id?` | `public` | `string` | The ID associated with this stream event. | [`StreamEventBase`](StreamEventBase.md).[`id`](StreamEventBase.md#id) | [packages/protocol/src/language-model/stream.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L40) |
| <a id="kind"></a> `kind` | `readonly` | `"finish"` | - | - | [packages/protocol/src/language-model/stream.ts:161](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L161) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | [`StreamEventBase`](StreamEventBase.md).[`providerMetadata`](StreamEventBase.md#providermetadata) | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
| <a id="usage"></a> `usage` | `public` | [`LanguageModelUsage`](LanguageModelUsage.md) | Total usage data for the execution. | - | [packages/protocol/src/language-model/stream.ts:171](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L171) |
