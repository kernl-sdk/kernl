---
layout: docs
---

# Interface: MemoryByte

Defined in: [packages/kernl/src/memory/types.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L51)

Memory content - the smallest coherent unit of memory.

May contain multiple modalities (e.g., captioned image, video with transcript).
At most one of each modality type.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="audio"></a> `audio?` | `AudioByte` | [packages/kernl/src/memory/types.ts:54](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L54) |
| <a id="image"></a> `image?` | `ImageByte` | [packages/kernl/src/memory/types.ts:53](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L53) |
| <a id="object"></a> `object?` | [`JSONObject`](../../protocol/type-aliases/JSONObject.md) | [packages/kernl/src/memory/types.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L56) |
| <a id="text"></a> `text?` | `string` | [packages/kernl/src/memory/types.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L52) |
| <a id="video"></a> `video?` | `VideoByte` | [packages/kernl/src/memory/types.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L55) |
