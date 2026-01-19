# @kernl-sdk/react

> **For AI agents**: These reference docs help coding agents understand the kernl SDK. If your agent gets stuck, share this page with it.

React hooks and components for building AI-powered interfaces.

## useRealtime

Connect to a realtime voice agent:

```tsx
import { useRealtime } from '@kernl-sdk/react';

function VoiceChat() {
  const { status, connect, disconnect } = useRealtime({
    agent: 'voice-assistant',
    credentials: async () => fetchCredentials(),
    onMessage: (event) => console.log(event),
  });

  return (
    <button onClick={status === 'connected' ? disconnect : connect}>
      {status === 'connected' ? 'Disconnect' : 'Connect'}
    </button>
  );
}
```

## useBrowserAudio

Capture microphone audio for voice input:

```tsx
import { useBrowserAudio } from '@kernl-sdk/react';

function AudioCapture() {
  const { start, stop, isRecording } = useBrowserAudio({
    onAudioData: (data) => sendToAgent(data),
  });

  return (
    <button onClick={isRecording ? stop : start}>
      {isRecording ? 'Stop' : 'Start'} Recording
    </button>
  );
}
```

## LiveWaveform

Visualize audio input/output:

```tsx
import { LiveWaveform } from '@kernl-sdk/react';

<LiveWaveform source={audioSource} className="h-16 w-full" />
```

## BrowserChannel

Low-level WebSocket channel for custom realtime implementations:

```ts
import { BrowserChannel } from '@kernl-sdk/react';

const channel = new BrowserChannel({ url: 'wss://...' });
await channel.connect();
```
