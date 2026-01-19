---
layout: docs
---

# Interface: MemorySearchIndex

Defined in: [packages/kernl/src/memory/indexes.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L55)

Memory search index - vector/semantic search over memories.

## Extends

- [`MemoryIndexBase`](MemoryIndexBase.md)\<[`MemorySearchQuery`](MemorySearchQuery.md), [`SearchHit`](../../retrieval/interfaces/SearchHit.md)\<`IndexMemoryRecord`\>[]\>

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `string` | [`MemoryIndexBase`](MemoryIndexBase.md).[`id`](MemoryIndexBase.md#id) | [packages/kernl/src/memory/indexes.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L24) |

## Methods

### delete()

```ts
delete(ids: string | string[]): Promise<void>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:44](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L44)

Remove one or more records from this index (DB row remains).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | `string` \| `string`[] |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryIndexBase`](MemoryIndexBase.md).[`delete`](MemoryIndexBase.md#delete)

***

### index()

```ts
index(memories: 
  | MemoryRecord
| MemoryRecord[]): Promise<void>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:34](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L34)

Index one or more memory records (idempotent upsert).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `memories` | \| [`MemoryRecord`](../type-aliases/MemoryRecord.md) \| [`MemoryRecord`](../type-aliases/MemoryRecord.md)[] |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryIndexBase`](MemoryIndexBase.md).[`index`](MemoryIndexBase.md#index)

***

### query()

```ts
query(query: MemorySearchQuery): Promise<SearchHit<IndexMemoryRecord>[]>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L29)

Query the index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`MemorySearchQuery`](MemorySearchQuery.md) |

#### Returns

`Promise`\<[`SearchHit`](../../retrieval/interfaces/SearchHit.md)\<`IndexMemoryRecord`\>[]\>

#### Inherited from

[`MemoryIndexBase`](MemoryIndexBase.md).[`query`](MemoryIndexBase.md#query)

***

### update()

```ts
update(updates: 
  | MemoryRecordUpdate
| MemoryRecordUpdate[]): Promise<void>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:39](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L39)

Partially update one or more records' projections.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `updates` | \| [`MemoryRecordUpdate`](MemoryRecordUpdate.md) \| [`MemoryRecordUpdate`](MemoryRecordUpdate.md)[] |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryIndexBase`](MemoryIndexBase.md).[`update`](MemoryIndexBase.md#update)

***

### warm()

```ts
warm(index: string): Promise<void>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L49)

Index warming (optional).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `string` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryIndexBase`](MemoryIndexBase.md).[`warm`](MemoryIndexBase.md#warm)
