import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

/**
 * Context type for light control.
 */
export interface LightContext {
  setLight: (on: boolean) => void;
}

/**
 * Tool for controlling a light switch.
 */
const toggleLight = tool({
  id: "toggle_light",
  description: "Turn the light on or off",
  parameters: z.object({
    on: z
      .boolean()
      .describe("Whether to turn the light on (true) or off (false)"),
  }),
  execute: async (ctx: Context<LightContext>, { on }: { on: boolean }) => {
    ctx.context.setLight(on);
    return on ? "Light turned on" : "Light turned off";
  },
});

/**
 * Toolkit for light control demo.
 */
export const lightToolkit = new Toolkit<LightContext>({
  id: "light",
  description: "Light control tools",
  tools: [toggleLight],
});
