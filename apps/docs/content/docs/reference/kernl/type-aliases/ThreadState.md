---
layout: docs
---

# Type Alias: ThreadState

```ts
type ThreadState = 
  | typeof RUNNING
  | typeof STOPPED
  | typeof INTERRUPTIBLE
  | typeof UNINTERRUPTIBLE
  | typeof ZOMBIE
  | typeof DEAD;
```

Defined in: [packages/kernl/src/thread/types.ts:60](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/types.ts#L60)

Thread state discriminated union
