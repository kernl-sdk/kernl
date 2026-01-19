---
layout: docs
---

# Type Alias: RealtimeToolChoice

```ts
type RealtimeToolChoice = 
  | {
  kind: "auto";
}
  | {
  kind: "none";
}
  | {
  kind: "required";
};
```

Defined in: [packages/protocol/src/realtime/types.ts:168](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L168)

Tool choice behavior for realtime sessions.
