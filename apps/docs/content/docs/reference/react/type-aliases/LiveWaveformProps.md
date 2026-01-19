---
layout: docs
---

# Type Alias: LiveWaveformProps

```ts
type LiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  audio?: AudioSource | null;
  barColor?: string;
  barGap?: number;
  barHeight?: number;
  barRadius?: number;
  barWidth?: number;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  historySize?: number;
  mode?: "scrolling" | "static";
  processing?: boolean;
  sensitivity?: number;
  updateRate?: number;
};
```

Defined in: [react/src/components/live-waveform.tsx:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L15)

## Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `active?` | `boolean` | - | [react/src/components/live-waveform.tsx:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L16) |
| `audio?` | [`AudioSource`](../interfaces/AudioSource.md) \| `null` | Audio source for visualization (e.g., BrowserChannel). | [react/src/components/live-waveform.tsx:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L21) |
| `barColor?` | `string` | - | [react/src/components/live-waveform.tsx:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L26) |
| `barGap?` | `number` | - | [react/src/components/live-waveform.tsx:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L24) |
| `barHeight?` | `number` | - | [react/src/components/live-waveform.tsx:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L23) |
| `barRadius?` | `number` | - | [react/src/components/live-waveform.tsx:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L25) |
| `barWidth?` | `number` | - | [react/src/components/live-waveform.tsx:22](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L22) |
| `fadeEdges?` | `boolean` | - | [react/src/components/live-waveform.tsx:27](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L27) |
| `fadeWidth?` | `number` | - | [react/src/components/live-waveform.tsx:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L28) |
| `height?` | `string` \| `number` | - | [react/src/components/live-waveform.tsx:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L29) |
| `historySize?` | `number` | - | [react/src/components/live-waveform.tsx:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L31) |
| `mode?` | `"scrolling"` \| `"static"` | - | [react/src/components/live-waveform.tsx:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L33) |
| `processing?` | `boolean` | - | [react/src/components/live-waveform.tsx:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L17) |
| `sensitivity?` | `number` | - | [react/src/components/live-waveform.tsx:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L30) |
| `updateRate?` | `number` | - | [react/src/components/live-waveform.tsx:32](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/components/live-waveform.tsx#L32) |
