---
layout: docs
---

# Interface: RealtimeTransport

Defined in: [packages/protocol/src/realtime/model.ts:123](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L123)

A transport factory for custom connection mechanisms (e.g., WebRTC).

Pass to RealtimeSession when you need to handle audio via media tracks
instead of base64 events.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="handlesaudio"></a> `handlesAudio` | `readonly` | `boolean` | Whether this transport handles audio I/O internally (e.g., WebRTC). If true, cannot use a channel with this transport. | [packages/protocol/src/realtime/model.ts:128](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L128) |

## Methods

### connect()

```ts
connect(model: RealtimeModel, options?: RealtimeConnectOptions): Promise<RealtimeConnection>;
```

Defined in: [packages/protocol/src/realtime/model.ts:133](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L133)

Create a connection using this transport.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`RealtimeModel`](RealtimeModel.md) |
| `options?` | [`RealtimeConnectOptions`](RealtimeConnectOptions.md) |

#### Returns

`Promise`\<[`RealtimeConnection`](RealtimeConnection.md)\>
