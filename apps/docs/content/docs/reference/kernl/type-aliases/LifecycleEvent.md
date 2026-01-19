---
layout: docs
---

# Type Alias: LifecycleEvent\<TContext, TOutput\>

```ts
type LifecycleEvent<TContext, TOutput> = 
  | ThreadStartEvent<TContext>
  | ThreadStopEvent<TContext, TOutput>
  | ModelCallStartEvent<TContext>
  | ModelCallEndEvent<TContext>
  | ToolCallStartEvent<TContext>
| ToolCallEndEvent<TContext>;
```

Defined in: [packages/kernl/src/lifecycle.ts:264](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/lifecycle.ts#L264)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |
| `TOutput` | `unknown` |
