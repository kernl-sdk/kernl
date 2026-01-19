---
layout: docs
---

# Interface: LanguageModelUsage

Defined in: [packages/protocol/src/language-model/model.ts:130](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L130)

Usage information for a language model call.

If your API return additional usage information, you can add it to the
provider metadata under your provider's key.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="inputtokens"></a> `inputTokens` | \{ `cacheRead`: `number` \| `undefined`; `cacheWrite`: `number` \| `undefined`; `noCache`: `number` \| `undefined`; `total`: `number` \| `undefined`; \} | Input token usage breakdown. | [packages/protocol/src/language-model/model.ts:134](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L134) |
| `inputTokens.cacheRead` | `number` \| `undefined` | Input tokens read from cache. | [packages/protocol/src/language-model/model.ts:148](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L148) |
| `inputTokens.cacheWrite` | `number` \| `undefined` | Input tokens written to cache. | [packages/protocol/src/language-model/model.ts:153](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L153) |
| `inputTokens.noCache` | `number` \| `undefined` | Input tokens that were not cached. | [packages/protocol/src/language-model/model.ts:143](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L143) |
| `inputTokens.total` | `number` \| `undefined` | Total input tokens used. | [packages/protocol/src/language-model/model.ts:138](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L138) |
| <a id="outputtokens"></a> `outputTokens` | \{ `reasoning`: `number` \| `undefined`; `text`: `number` \| `undefined`; `total`: `number` \| `undefined`; \} | Output token usage breakdown. | [packages/protocol/src/language-model/model.ts:159](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L159) |
| `outputTokens.reasoning` | `number` \| `undefined` | Reasoning/thinking tokens. | [packages/protocol/src/language-model/model.ts:173](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L173) |
| `outputTokens.text` | `number` \| `undefined` | Text generation tokens. | [packages/protocol/src/language-model/model.ts:168](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L168) |
| `outputTokens.total` | `number` \| `undefined` | Total output tokens used. | [packages/protocol/src/language-model/model.ts:163](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L163) |
