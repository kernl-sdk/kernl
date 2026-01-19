---
layout: docs
---

# Type Alias: FieldValue

```ts
type FieldValue = 
  | ScalarValue
  | ScalarValue[]
  | GeoPoint
  | GeoPoint[]
  | DenseVector
  | SparseVector
  | {
[key: string]: FieldValue;
}
  | {
[key: string]: FieldValue;
}[]
  | undefined;
```

Defined in: [retrieval/src/types.ts:74](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/types.ts#L74)

Field value - the actual data stored in a field.

A field is in one of two states:
- *Has a value*: any non-null value
- *No value*: `null`, `undefined`, or omitted entirely

The system treats `null` and `undefined` (or missing) as equivalent.
Adapters normalize "no value" internally (e.g., storing as SQL NULL).

For filter semantics:
- `{ field: value }` matches docs where field has that non-null value
- `{ field: null }` matches docs where field has no value (null or missing)
- `{ field: { $exists: true } }` matches docs where field has a value
- `{ field: { $exists: false } }` matches docs where field has no value
