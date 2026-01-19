---
layout: docs
---

# Interface: ThreadUpdateParams

Defined in: [packages/kernl/src/api/resources/threads/types.ts:126](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L126)

Patch for updating caller-owned thread fields.

Semantics for all fields:
- `undefined` → leave the field unchanged
- value (`object` / `string` / etc.) → replace the field
- `null` → clear the field (for `title`, clears `metadata.title`)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="context"></a> `context?` | `Record`\<`string`, `unknown`\> \| `null` | Thread context object. | [packages/kernl/src/api/resources/threads/types.ts:130](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L130) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> \| `null` | Arbitrary metadata bag attached to the thread. | [packages/kernl/src/api/resources/threads/types.ts:135](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L135) |
| <a id="title"></a> `title?` | `string` \| `null` | Human-readable title (stored in `metadata.title`). | [packages/kernl/src/api/resources/threads/types.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/api/resources/threads/types.ts#L140) |
