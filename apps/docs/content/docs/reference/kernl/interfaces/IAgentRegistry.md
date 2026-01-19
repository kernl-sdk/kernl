---
layout: docs
---

# Interface: IAgentRegistry

Defined in: [packages/kernl/src/kernl/types.ts:92](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L92)

Agent registry interface.

Satisfied by Map<string, BaseAgent>.

## Methods

### get()

```ts
get(id: string): BaseAgent<any, "text"> | undefined;
```

Defined in: [packages/kernl/src/kernl/types.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L93)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`BaseAgent`\<`any`, `"text"`\> \| `undefined`
