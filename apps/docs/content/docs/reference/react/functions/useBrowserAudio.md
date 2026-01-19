---
layout: docs
---

# Function: useBrowserAudio()

```ts
function useBrowserAudio(): UseBrowserAudioReturn;
```

Defined in: [react/src/hooks/use-browser-audio.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-browser-audio.ts#L37)

React hook for managing browser audio resources.

Creates a BrowserChannel for mic capture and audio playback.
Handles cleanup on unmount and provides a fresh channel after close.

## Returns

[`UseBrowserAudioReturn`](../interfaces/UseBrowserAudioReturn.md)

## Example

```tsx
const { channel } = useBrowserAudio();

const start = async () => {
  await channel.init();  // request mic, setup audio
  connect(credential);
};

const stop = () => {
  disconnect();
  channel.close();  // cleanup audio resources
};
```
