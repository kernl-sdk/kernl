---
layout: docs
---

# Interface: IndexHandle\<TDocument\>

Defined in: [retrieval/src/handle.ts:50](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L50)

Handle to a specific index.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TDocument` | [`UnknownDocument`](../type-aliases/UnknownDocument.md) | Shape of the document fields. Defaults to `UnknownDocument`. Obtained via `SearchIndex.index(id)`. |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `string` | [retrieval/src/handle.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L51) |

## Methods

### addField()

```ts
addField(field: string, schema: FieldSchema): Promise<void>;
```

Defined in: [retrieval/src/handle.ts:131](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L131)

Add a field to the index schema.

Not all backends support schema mutation. Throws if unsupported.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `field` | `string` |
| `schema` | [`FieldSchema`](../type-aliases/FieldSchema.md) |

#### Returns

`Promise`\<`void`\>

***

### delete()

```ts
delete(ids: string | string[]): Promise<DeleteResult>;
```

Defined in: [retrieval/src/handle.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L93)

Delete one or more documents by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | `string` \| `string`[] |

#### Returns

`Promise`\<[`DeleteResult`](DeleteResult.md)\>

***

### patch()

```ts
patch(patches: 
  | DocumentPatch<TDocument>
| DocumentPatch<TDocument>[]): Promise<PatchResult>;
```

Defined in: [retrieval/src/handle.ts:86](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L86)

Patch one or more documents.

Only specified fields are updated. Set a field to `null` to unset it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patches` | \| [`DocumentPatch`](../type-aliases/DocumentPatch.md)\<`TDocument`\> \| [`DocumentPatch`](../type-aliases/DocumentPatch.md)\<`TDocument`\>[] |

#### Returns

`Promise`\<[`PatchResult`](PatchResult.md)\>

#### Example

```ts
// update title only
await index.patch({ id: "doc-1", title: "New Title" });

// unset a field
await index.patch({ id: "doc-1", description: null });
```

***

### query()

```ts
query(query: QueryInput): Promise<SearchHit<TDocument>[]>;
```

Defined in: [retrieval/src/handle.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L122)

Query the index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`QueryInput`](../type-aliases/QueryInput.md) |

#### Returns

`Promise`\<[`SearchHit`](SearchHit.md)\<`TDocument`\>[]\>

#### Example

```ts
// simple text search
await index.query({ content: "quick fox" });

// vector search
await index.query({ embedding: [0.1, 0.2, ...] });

// hybrid sum fusion
await index.query([
  { content: "quick fox", weight: 0.7 },
  { embedding: [...], weight: 0.3 },
]);

// with filter
await index.query({
  query: [{ content: "fox" }],
  filter: { published: true },
  limit: 20,
});
```

***

### upsert()

```ts
upsert(docs: TDocument | TDocument[]): Promise<UpsertResult>;
```

Defined in: [retrieval/src/handle.ts:70](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/handle.ts#L70)

Upsert one or more documents.

Documents are flat objects. The adapter determines which field is the
primary key (typically `id` by convention).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `docs` | `TDocument` \| `TDocument`[] |

#### Returns

`Promise`\<[`UpsertResult`](UpsertResult.md)\>

#### Example

```ts
await index.upsert({ id: "doc-1", title: "Hello", embedding: [0.1, ...] });
await index.upsert([
  { id: "doc-1", title: "Hello" },
  { id: "doc-2", title: "World" },
]);
```
