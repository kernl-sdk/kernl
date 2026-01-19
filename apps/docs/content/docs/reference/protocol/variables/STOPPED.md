---
layout: docs
---

# Variable: STOPPED

```ts
const STOPPED: "stopped" = "stopped";
```

Defined in: [packages/protocol/src/constants.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/constants.ts#L59)

Task has been stopped by a signal (SIGSTOP).
Will remain stopped until explicitly continued (SIGCONT).

Examples:
- User explicitly paused the agent
- Debugger attached
