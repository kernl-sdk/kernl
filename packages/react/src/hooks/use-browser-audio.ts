import { useState, useEffect } from "react";

import { BrowserChannel } from "@/lib/browser-channel";

/**
 * Return value from the useBrowserAudio hook.
 */
export interface UseBrowserAudioReturn {
  /**
   * Browser audio channel for mic capture and playback.
   * Pass to useRealtime and LiveWaveform.
   */
  channel?: BrowserChannel;
}

/**
 * React hook for managing browser audio resources.
 *
 * Creates a BrowserChannel for mic capture and audio playback.
 * Handles cleanup on unmount and provides a fresh channel after close.
 *
 * @example
 * ```tsx
 * const { channel } = useBrowserAudio();
 *
 * const start = async () => {
 *   await channel.init();  // request mic, setup audio
 *   connect(credential);
 * };
 *
 * const stop = () => {
 *   disconnect();
 *   channel.close();  // cleanup audio resources
 * };
 * ```
 */
export function useBrowserAudio(): UseBrowserAudioReturn {
  const [channel, setChannel] = useState<BrowserChannel>();

  useEffect(() => {
    const ch = new BrowserChannel();
    setChannel(ch);

    return () => {
      ch.close();
    };
  }, []);

  return { channel };
}
