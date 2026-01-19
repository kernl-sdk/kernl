---
layout: docs
---

# Interface: SystemMessage

Defined in: [packages/protocol/src/language-model/item.ts:167](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L167)

## Extends

- [`MessageBase`](MessageBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `public` | [`MessagePart`](../type-aliases/MessagePart.md)[] | The content parts of the message. | [`MessageBase`](MessageBase.md).[`content`](MessageBase.md#content) | [packages/protocol/src/language-model/item.ts:159](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L159) |
| <a id="id"></a> `id` | `public` | `string` | The unique identifier for the message. | [`MessageBase`](MessageBase.md).[`id`](MessageBase.md#id) | [packages/protocol/src/language-model/item.ts:154](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L154) |
| <a id="kind"></a> `kind` | `readonly` | `"message"` | - | [`MessageBase`](MessageBase.md).[`kind`](MessageBase.md#kind) | [packages/protocol/src/language-model/item.ts:149](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L149) |
| <a id="metadata"></a> `metadata?` | `public` | `Record`\<`string`, `unknown`\> | Optional additional metadata for the message | [`MessageBase`](MessageBase.md).[`metadata`](MessageBase.md#metadata) | [packages/protocol/src/language-model/item.ts:164](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L164) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | [`MessageBase`](MessageBase.md).[`providerMetadata`](MessageBase.md#providermetadata) | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="role"></a> `role` | `readonly` | `"system"` | Representing a system message to the user | - | [packages/protocol/src/language-model/item.ts:171](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L171) |
