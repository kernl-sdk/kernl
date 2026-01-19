---
layout: docs
---

# Type Alias: WebSocketConstructor()

```ts
type WebSocketConstructor = (url: string | URL, protocols?: string | string[]) => WebSocketLike;
```

Defined in: [packages/protocol/src/realtime/types.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L99)

WebSocket constructor type for cross-platform compatibility.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` \| `URL` |
| `protocols?` | `string` \| `string`[] |

## Returns

[`WebSocketLike`](../interfaces/WebSocketLike.md)
