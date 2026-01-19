---
layout: docs
---

# Type Alias: DocumentPatch\<TDocument\>

```ts
type DocumentPatch<TDocument> = { [K in keyof TDocument]?: TDocument[K] | null } & {
  id: string;
};
```

Defined in: [retrieval/src/handle.ts:39](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L39)

Document patch - partial update with null to unset fields.

Requires `id` (or the configured pkey field). Other fields are optional
and can be set to `null` to unset them.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | [retrieval/src/handle.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L41) |

## Type Parameters

| Type Parameter |
| ------ |
| `TDocument` |
