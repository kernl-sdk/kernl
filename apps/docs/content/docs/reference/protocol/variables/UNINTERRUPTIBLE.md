---
layout: docs
---

# Variable: UNINTERRUPTIBLE

```ts
const UNINTERRUPTIBLE: "uninterruptible" = "uninterruptible";
```

Defined in: [packages/protocol/src/constants.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/constants.ts#L49)

Task is sleeping/blocked and CANNOT be interrupted by signals.
Only wakes when the condition is met.

Examples:
- Waiting for critical I/O (model API call)
- Waiting for resource that MUST complete

Use sparingly - these tasks can't be cancelled!
