---
layout: docs
---

# Interface: FilePartWithUri

Defined in: [packages/protocol/src/language-model/item.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L101)

A file referenced by URI.

## Extends

- `FilePartBase`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="data"></a> `data?` | `public` | `undefined` | The `data` property must be absent when `uri` is present. | - | [packages/protocol/src/language-model/item.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L110) |
| <a id="filename"></a> `filename?` | `public` | `string` | Optional filename for the file | `FilePartBase.filename` | [packages/protocol/src/language-model/item.ts:80](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L80) |
| <a id="kind"></a> `kind` | `readonly` | `"file"` | - | `FilePartBase.kind` | [packages/protocol/src/language-model/item.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L68) |
| <a id="metadata"></a> `metadata?` | `public` | `Record`\<`string`, `unknown`\> | Optional metadata associated with this part. | `FilePartBase.metadata` | [packages/protocol/src/language-model/item.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L49) |
| <a id="mimetype"></a> `mimeType` | `public` | `string` | The IANA media type of the file, e.g. `image/png` or `audio/mp3`. **See** https://www.iana.org/assignments/media-types/media-types.xhtml | `FilePartBase.mimeType` | [packages/protocol/src/language-model/item.ts:75](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L75) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | `FilePartBase.providerMetadata` | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="uri"></a> `uri` | `public` | `string` | A URL pointing to the file's content. | - | [packages/protocol/src/language-model/item.ts:105](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L105) |
