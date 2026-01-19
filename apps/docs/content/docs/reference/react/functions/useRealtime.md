---
layout: docs
---

# Function: useRealtime()

```ts
function useRealtime<TContext>(agent: RealtimeAgent<TContext>, options: UseRealtimeOptions<TContext>): UseRealtimeReturn;
```

Defined in: [react/src/hooks/use-realtime.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L100)

React hook for managing a realtime voice session.

Handles connection lifecycle, status updates, and cleanup on unmount.

## Type Parameters

| Type Parameter |
| ------ |
| `TContext` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `agent` | [`RealtimeAgent`](../../kernl/classes/RealtimeAgent.md)\<`TContext`\> |
| `options` | [`UseRealtimeOptions`](../interfaces/UseRealtimeOptions.md)\<`TContext`\> |

## Returns

[`UseRealtimeReturn`](../interfaces/UseRealtimeReturn.md)

## Example

```tsx
const { status, connect, disconnect } = useRealtime(agent, {
  model: openai.realtime("gpt-4o-realtime"),
  channel,
  ctx: { setCart },
});

const start = async () => {
  const { credential } = await fetch("/api/credential").then(r => r.json());
  await channel.init();
  connect(credential);
};
```
