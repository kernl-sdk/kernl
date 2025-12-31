import { RealtimeAgent } from "kernl";
import { xai } from "@kernl-sdk/xai";

import { lightToolkit, type LightContext } from "@/toolkits/light";

export const watson = new RealtimeAgent<LightContext>({
  id: "watson",
  name: "Watson",
  description: "Voice-enabled general assistant",
  model: xai.realtime(),
  voice: { voiceId: "Sal" },
  instructions:
    "You are Watson, a helpful voice assistant. Be concise and conversational. You can control a light - turn it on or off when asked.",
  toolkits: [lightToolkit],
});
