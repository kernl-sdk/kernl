---
layout: docs
---

# Variable: INTERRUPTIBLE

```ts
const INTERRUPTIBLE: "interruptible" = "interruptible";
```

Defined in: [packages/protocol/src/constants.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/constants.ts#L37)

Task is sleeping/blocked, waiting for a condition.
Can be woken up by:
- The condition being met (e.g., approval granted)
- A signal (e.g., user cancellation)

Examples:
- Waiting for tool approval
- Waiting for user input
- Sleeping on a timer
