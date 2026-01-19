---
layout: docs
---

# Interface: ToolInputStartEvent

Defined in: [packages/protocol/src/language-model/stream.ts:109](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L109)

Stream event indicating the start of tool input generation.

## Extends

- [`StreamEventBase`](StreamEventBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `public` | `string` | The ID associated with this stream event. | [`StreamEventBase`](StreamEventBase.md).[`id`](StreamEventBase.md#id) | - | [packages/protocol/src/language-model/stream.ts:111](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L111) |
| <a id="kind"></a> `kind` | `readonly` | `"tool.input.start"` | - | - | - | [packages/protocol/src/language-model/stream.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L110) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata for the event. | - | [`StreamEventBase`](StreamEventBase.md).[`providerMetadata`](StreamEventBase.md#providermetadata) | [packages/protocol/src/language-model/stream.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L45) |
| <a id="title"></a> `title?` | `public` | `string` | Optional title for the tool call. | - | - | [packages/protocol/src/language-model/stream.ts:121](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L121) |
| <a id="toolid"></a> `toolId` | `public` | `string` | The identifier of the tool being called. | - | - | [packages/protocol/src/language-model/stream.ts:116](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/stream.ts#L116) |
