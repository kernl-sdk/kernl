import { RealtimeAgent } from "kernl";
import { openai } from "@kernl-sdk/openai";

import { lightToolkit, type LightContext } from "@/toolkits/light";

export const watson = new RealtimeAgent<LightContext>({
  id: "watson",
  name: "Watson",
  description: "Voice-enabled general assistant",
  model: openai.realtime("gpt-realtime"),
  instructions:
    "You are Watson, a helpful voice assistant. Be concise and conversational. You can control a light - turn it on or off when asked.",
  toolkits: [lightToolkit],
});
