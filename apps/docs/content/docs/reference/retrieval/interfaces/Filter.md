---
layout: docs
---

# Interface: Filter

Defined in: [retrieval/src/query.ts:80](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L80)

MongoDB-style filter expression.

## Example

```ts
// Equality
{ status: "active" }

// Comparison
{ views: { $gt: 1000 } }

// Set membership
{ tags: { $in: ["ai", "ml"] } }

// Logical AND (implicit)
{ status: "active", views: { $gte: 100 } }

// Logical AND (explicit)
{ $and: [{ status: "active" }, { views: { $gte: 100 } }] }

// Logical OR
{ $or: [{ status: "draft" }, { status: "review" }] }
```

## Extends

- [`LogicalOps`](LogicalOps.md)

## Indexable

```ts
[field: string]: 
  | ScalarValue
  | FieldOps
  | Filter
  | Filter[]
  | undefined
```

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="and"></a> `$and?` | `Filter`[] | [`LogicalOps`](LogicalOps.md).[`$and`](LogicalOps.md#and) | [retrieval/src/query.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L51) |
| <a id="not"></a> `$not?` | `Filter` | [`LogicalOps`](LogicalOps.md).[`$not`](LogicalOps.md#not) | [retrieval/src/query.ts:53](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L53) |
| <a id="or"></a> `$or?` | `Filter`[] | [`LogicalOps`](LogicalOps.md).[`$or`](LogicalOps.md#or) | [retrieval/src/query.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/query.ts#L52) |
