---
layout: docs
---

# Variable: ZOMBIE

```ts
const ZOMBIE: "zombie" = "zombie";
```

Defined in: [packages/protocol/src/constants.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/constants.ts#L69)

Task has finished execution but hasn't been cleaned up yet.
Waiting for parent to read exit status (wait/waitpid).

Examples:
- Agent completed but result not yet retrieved
- Child agent finished, parent needs to collect result
