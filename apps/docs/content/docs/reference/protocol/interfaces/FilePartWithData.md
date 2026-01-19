---
layout: docs
---

# Interface: FilePartWithData

Defined in: [packages/protocol/src/language-model/item.ts:86](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L86)

A file with inline data (base64 string or binary).

## Extends

- `FilePartBase`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `public` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | File data as base64 encoded string or binary data. | - | [packages/protocol/src/language-model/item.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L90) |
| <a id="filename"></a> `filename?` | `public` | `string` | Optional filename for the file | `FilePartBase.filename` | [packages/protocol/src/language-model/item.ts:80](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L80) |
| <a id="kind"></a> `kind` | `readonly` | `"file"` | - | `FilePartBase.kind` | [packages/protocol/src/language-model/item.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L68) |
| <a id="metadata"></a> `metadata?` | `public` | `Record`\<`string`, `unknown`\> | Optional metadata associated with this part. | `FilePartBase.metadata` | [packages/protocol/src/language-model/item.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L49) |
| <a id="mimetype"></a> `mimeType` | `public` | `string` | The IANA media type of the file, e.g. `image/png` or `audio/mp3`. **See** https://www.iana.org/assignments/media-types/media-types.xhtml | `FilePartBase.mimeType` | [packages/protocol/src/language-model/item.ts:75](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L75) |
| <a id="providermetadata"></a> `providerMetadata?` | `public` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Optional provider-specific metadata for the text part. | `FilePartBase.providerMetadata` | [packages/protocol/src/language-model/item.ts:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L27) |
| <a id="uri"></a> `uri?` | `public` | `undefined` | The `uri` property must be absent when `data` is present. | - | [packages/protocol/src/language-model/item.ts:95](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L95) |
