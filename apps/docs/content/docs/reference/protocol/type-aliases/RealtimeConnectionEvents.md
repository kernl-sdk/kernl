---
layout: docs
---

# Type Alias: RealtimeConnectionEvents

```ts
type RealtimeConnectionEvents = {
  error: [Error];
  event: [RealtimeServerEvent];
  interrupted: [];
  status: [TransportStatus];
};
```

Defined in: [packages/protocol/src/realtime/model.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L15)

Events emitted by a realtime connection.

## Properties

### error

```ts
error: [Error];
```

Defined in: [packages/protocol/src/realtime/model.ts:18](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L18)

***

### event

```ts
event: [RealtimeServerEvent];
```

Defined in: [packages/protocol/src/realtime/model.ts:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L16)

***

### interrupted

```ts
interrupted: [];
```

Defined in: [packages/protocol/src/realtime/model.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L19)

***

### status

```ts
status: [TransportStatus];
```

Defined in: [packages/protocol/src/realtime/model.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L17)
