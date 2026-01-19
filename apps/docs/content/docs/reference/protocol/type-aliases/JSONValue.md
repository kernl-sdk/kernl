---
layout: docs
---

# Type Alias: JSONValue

```ts
type JSONValue = 
  | null
  | string
  | number
  | boolean
  | JSONObject
  | JSONArray;
```

Defined in: [packages/protocol/src/json.ts:5](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/json.ts#L5)

A JSON value can be a string, number, boolean, object, array, or null.
JSON values can be serialized and deserialized by the JSON.stringify and JSON.parse methods.
