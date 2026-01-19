---
layout: docs
---

# Class: Context\<TContext\>

Defined in: [packages/kernl/src/context.ts:12](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L12)

A propagation mechanism which carries execution-scoped values across API boundaries and between logically associated
execution units.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Constructors

### Constructor

```ts
new Context<TContext>(namespace: string, context: TContext): Context<TContext>;
```

Defined in: [packages/kernl/src/context.ts:78](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L78)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `namespace` | `string` | `"kernl"` |
| `context` | `TContext` | `...` |

#### Returns

`Context`\<`TContext`\>

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="agent"></a> `agent?` | [`Agent`](Agent.md)\<`any`, `any`\> | The agent executing this context. Set by the thread during execution. NOTE: Primarily used by system tools (e.g., memory) that need agent access. Uses `any` to avoid invariance issues when composing toolkits. | [packages/kernl/src/context.ts:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L30) |
| <a id="approvals"></a> `approvals` | `Map`\<`string`, `ApprovalStatus`\> | Map of tool call IDs to their approval status. (TEMPORARY) Used until the actions system is refined. | [packages/kernl/src/context.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L40) |
| <a id="context"></a> `context` | `TContext` | The inner context object. | [packages/kernl/src/context.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L21) |
| <a id="namespace"></a> `namespace` | `string` | The namespace that this context belongs to. | [packages/kernl/src/context.ts:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L16) |

## Methods

### approve()

```ts
approve(callId: string): void;
```

Defined in: [packages/kernl/src/context.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L46)

Approve a tool call by its call ID.
(TEMPORARY) Used until the actions system is refined.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `callId` | `string` |

#### Returns

`void`

***

### md()

```ts
md(): string;
```

Defined in: [packages/kernl/src/context.ts:120](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L120)

Render the context object as a markdown string:

 <context>
   <user>
     <name>John</name>
     <email>john@gmail.com</email>
   </user>
   <org>
     <id>org_235234523</id>
     <name>Acme Corp.<name>
   </org>
 </context>

#### Returns

`string`

***

### reject()

```ts
reject(callId: string): void;
```

Defined in: [packages/kernl/src/context.ts:54](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L54)

Reject a tool call by its call ID.
(TEMPORARY) Used until the actions system is refined.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `callId` | `string` |

#### Returns

`void`

***

### render()

```ts
render(self: Context<TContext>): string;
```

Defined in: [packages/kernl/src/context.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L90)

Renders the context as a prompt using the default format selected. Kernel would inject this info automatically, but exposed in case of control

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `self` | `Context`\<`TContext`\> |

#### Returns

`string`

***

### toJSON()

```ts
toJSON(): {
  context: any;
};
```

Defined in: [packages/kernl/src/context.ts:139](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L139)

#### Returns

```ts
{
  context: any;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `context` | `any` | [packages/kernl/src/context.ts:140](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L140) |

***

### yaml()

```ts
yaml(): string;
```

Defined in: [packages/kernl/src/context.ts:135](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/context.ts#L135)

Render the context object as a yaml string:

 context:
   user:
     name: John
     email: john@gmail.com
   org:
     id: org_235234523
     name: Acme Corp.

#### Returns

`string`
