---
layout: docs
---

# Class: WebSocketTransport

Defined in: [packages/kernl/src/realtime/transport.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L47)

WebSocket transport for realtime connections.

Use this transport when you need to provide a custom WebSocket implementation,
such as the 'ws' package in Node.js <22.

## Example

```ts
// Node.js <22
import WebSocket from 'ws';
const session = new RealtimeSession(agent, {
  transport: new WebSocketTransport({ websocket: WebSocket }),
  ...
});

// Browser or Node.js 22+ - no transport needed
const session = new RealtimeSession(agent, { ... });
```

## Implements

- [`RealtimeTransport`](../../protocol/interfaces/RealtimeTransport.md)

## Constructors

### Constructor

```ts
new WebSocketTransport(options?: WebSocketTransportOptions): WebSocketTransport;
```

Defined in: [packages/kernl/src/realtime/transport.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L51)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`WebSocketTransportOptions`](../interfaces/WebSocketTransportOptions.md) |

#### Returns

`WebSocketTransport`

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="handlesaudio"></a> `handlesAudio` | `readonly` | `false` | `false` | Whether this transport handles audio I/O internally (e.g., WebRTC). If true, cannot use a channel with this transport. | [packages/kernl/src/realtime/transport.ts:48](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L48) |

## Methods

### connect()

```ts
connect(model: RealtimeModel, options?: RealtimeConnectOptions): Promise<RealtimeConnection>;
```

Defined in: [packages/kernl/src/realtime/transport.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L55)

Create a connection using this transport.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`RealtimeModel`](../../protocol/interfaces/RealtimeModel.md) |
| `options?` | [`RealtimeConnectOptions`](../../protocol/interfaces/RealtimeConnectOptions.md) |

#### Returns

`Promise`\<[`RealtimeConnection`](../../protocol/interfaces/RealtimeConnection.md)\>

#### Implementation of

[`RealtimeTransport`](../../protocol/interfaces/RealtimeTransport.md).[`connect`](../../protocol/interfaces/RealtimeTransport.md#connect)
