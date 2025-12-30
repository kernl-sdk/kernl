import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { LiveWaveform, useRealtime, useBrowserAudio } from "@kernl-sdk/react";
import { Lightbulb } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { kernl } from "@/lib/kernl";
import { watson } from "@/agents/watson";
import type { LightContext } from "@/toolkits/light";

const realtimeAgents = { watson };

export default function VoicePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const agent = realtimeAgents[agentId as keyof typeof realtimeAgents];

  const [error, setError] = useState<string | null>(null);
  const [lightOn, setLightOn] = useState(false);

  /** Browser audio channel for mic capture and playback. */
  const { channel } = useBrowserAudio();

  // context for tools - memoize to prevent reconnection on every render
  const ctx = useMemo<LightContext>(() => ({ setLight: setLightOn }), []);

  const { status, connect, disconnect } = useRealtime(agent, {
    model: agent?.model,
    channel,
    ctx,
  });

  /**
   * Request mic permissions, init audio, and connect to the session
   */
  const start = useCallback(async () => {
    if (!agent || !channel) return;
    setError(null);

    try {
      const { credential } = await kernl.realtime.credential(
        agent.model.provider,
        agent.model.modelId,
      );

      await channel.init();

      connect(credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [agent, channel, connect]);

  /**
   * Disconnect from the model and release audio resources.
   */
  const stop = useCallback(() => {
    disconnect();
    channel?.close();
  }, [disconnect, channel]);

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  const isActive = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      {/* Agent info */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="size-13 mb-2 bg-surface border-2 border-steel">
          <AvatarFallback className="bg-transparent text-base">
            {agent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-lg font-semibold">{agent.name}</span>
      </div>

      {/* Light demo */}
      <div
        className={`flex items-center justify-center size-20 rounded-full transition-all duration-300 ${
          lightOn
            ? "bg-yellow-400/20 shadow-[0_0_40px_rgba(250,204,21,0.5)]"
            : "bg-muted/30"
        }`}
      >
        <Lightbulb
          className={`size-10 transition-colors duration-300 ${
            lightOn ? "text-yellow-400" : "text-muted-foreground/50"
          }`}
        />
      </div>

      {/* Waveform */}
      <div className="w-full max-w-xs px-8">
        <LiveWaveform
          audio={channel}
          active={isActive}
          processing={isConnecting}
          height={80}
          barColor="#73E380"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {status === "disconnected" && (
          <Button onClick={start} size="lg">
            Start Conversation
          </Button>
        )}

        {isConnecting && (
          <Button disabled size="lg">
            Connecting...
          </Button>
        )}

        {isActive && (
          <Button onClick={stop} variant="destructive" size="lg">
            End Conversation
          </Button>
        )}

        <p className="text-xs text-muted-foreground">Status: {status}</p>
      </div>
    </div>
  );
}
