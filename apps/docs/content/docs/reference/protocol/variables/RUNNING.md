---
layout: docs
---

# Variable: RUNNING

```ts
const RUNNING: "running" = "running";
```

Defined in: [packages/protocol/src/constants.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/constants.ts#L24)

Task is either:
- Currently executing
- In run queue waiting to be scheduled (might want to differentiate between running + queued here)
