---
layout: docs
---

# Interface: MemoryIndexBase\<TQuery, TResult\>

Defined in: [packages/kernl/src/memory/indexes.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L23)

Base interface for memory indexes.

All indexes share common lifecycle operations (index, patch, delete)
but differ in their query interface.

## Extended by

- [`MemorySearchIndex`](MemorySearchIndex.md)
- [`MemoryGraphIndex`](MemoryGraphIndex.md)
- [`MemoryArchiveIndex`](MemoryArchiveIndex.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TQuery` |
| `TResult` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `string` | [packages/kernl/src/memory/indexes.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L24) |

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

***

### query()

```ts
query(query: TQuery): Promise<TResult>;
```

Defined in: [packages/kernl/src/memory/indexes.ts:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/indexes.ts#L29)

Query the index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `TQuery` |

#### Returns

`Promise`\<`TResult`\>

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
