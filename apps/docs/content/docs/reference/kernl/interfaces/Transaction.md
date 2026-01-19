---
layout: docs
---

# Interface: Transaction

Defined in: [packages/kernl/src/storage/base.ts:64](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L64)

Transaction context providing transactional access to stores.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="threads"></a> `threads` | [`ThreadStore`](ThreadStore.md) | Thread store within this transaction. | [packages/kernl/src/storage/base.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L68) |

## Methods

### commit()

```ts
commit(): Promise<void>;
```

Defined in: [packages/kernl/src/storage/base.ts:77](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L77)

Commit the transaction.

#### Returns

`Promise`\<`void`\>

***

### rollback()

```ts
rollback(): Promise<void>;
```

Defined in: [packages/kernl/src/storage/base.ts:82](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L82)

Rollback the transaction.

#### Returns

`Promise`\<`void`\>
