---
layout: docs
---

# Function: message()

```ts
function message(options: {
  metadata?: Record<string, unknown>;
  providerMetadata?: SharedProviderMetadata;
  role: "system" | "assistant" | "user";
  text: string;
}): Message;
```

Defined in: [packages/protocol/src/language-model/utils.ts:9](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/utils.ts#L9)

Create a message with text content

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `metadata?`: `Record`\<`string`, `unknown`\>; `providerMetadata?`: [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md); `role`: `"system"` \| `"assistant"` \| `"user"`; `text`: `string`; \} |
| `options.metadata?` | `Record`\<`string`, `unknown`\> |
| `options.providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) |
| `options.role` | `"system"` \| `"assistant"` \| `"user"` |
| `options.text` | `string` |

## Returns

[`Message`](../type-aliases/Message.md)
