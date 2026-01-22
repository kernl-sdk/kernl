import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { ensureDesktop, type SandboxContext } from "./client";

/**
 * Take a screenshot of the desktop.
 */
export const screenshot = tool({
  id: "computer_screenshot",
  description: "Take a screenshot of the desktop",
  parameters: z.object({
    region: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
      .optional()
      .describe("Region to capture (omit for full screen)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { region }) => {
    const sandbox = await ensureDesktop(ctx);

    if (region) {
      return await sandbox.computerUse.screenshot.takeRegion(region);
    }

    return await sandbox.computerUse.screenshot.takeFullScreen();
  },
});

/**
 * Click the mouse at coordinates.
 */
export const click = tool({
  id: "computer_click",
  description: "Click the mouse at specified coordinates",
  parameters: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
    button: z
      .enum(["left", "right", "middle"])
      .optional()
      .describe("Mouse button (default: left)"),
    double: z.boolean().optional().describe("Double click (default: false)"),
  }),
  execute: async (ctx: Context<SandboxContext>, { x, y, button, double }) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.mouse.click(
      x,
      y,
      button ?? "left",
      double ?? false,
    );

    return { success: true, x, y };
  },
});

/**
 * Move the mouse to coordinates.
 */
export const move = tool({
  id: "computer_move",
  description: "Move the mouse cursor to specified coordinates",
  parameters: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  }),
  execute: async (ctx: Context<SandboxContext>, { x, y }) => {
    const sandbox = await ensureDesktop(ctx);
    const result = await sandbox.computerUse.mouse.move(x, y);

    return { x: result.x, y: result.y };
  },
});

/**
 * Drag the mouse from one point to another.
 */
export const drag = tool({
  id: "computer_drag",
  description: "Drag the mouse from start to end coordinates",
  parameters: z.object({
    start_x: z.number().describe("Starting X coordinate"),
    start_y: z.number().describe("Starting Y coordinate"),
    end_x: z.number().describe("Ending X coordinate"),
    end_y: z.number().describe("Ending Y coordinate"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { start_x, start_y, end_x, end_y },
  ) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.mouse.drag(start_x, start_y, end_x, end_y);

    return { success: true };
  },
});

/**
 * Scroll the mouse wheel.
 */
export const scroll = tool({
  id: "computer_scroll",
  description: "Scroll the mouse wheel at specified coordinates",
  parameters: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
    direction: z.enum(["up", "down"]).describe("Scroll direction"),
    amount: z.number().optional().describe("Scroll amount (default: 1)"),
  }),
  execute: async (
    ctx: Context<SandboxContext>,
    { x, y, direction, amount },
  ) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.mouse.scroll(x, y, direction, amount ?? 1);

    return { success: true };
  },
});

/**
 * Type text on the keyboard.
 */
export const type = tool({
  id: "computer_type",
  description: "Type text on the keyboard",
  parameters: z.object({
    text: z.string().describe("Text to type"),
    delay: z.number().optional().describe("Delay between characters in ms"),
  }),
  execute: async (ctx: Context<SandboxContext>, { text, delay }) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.keyboard.type(text, delay);

    return { success: true };
  },
});

/**
 * Press a key with optional modifiers.
 */
export const press = tool({
  id: "computer_press",
  description: "Press a key with optional modifiers",
  parameters: z.object({
    key: z.string().describe("Key to press (e.g., 'Return', 'Escape', 'a')"),
    modifiers: z
      .array(z.enum(["ctrl", "alt", "meta", "shift"]))
      .optional()
      .describe("Modifier keys"),
  }),
  execute: async (ctx: Context<SandboxContext>, { key, modifiers }) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.keyboard.press(key, modifiers);

    return { success: true };
  },
});

/**
 * Press a hotkey combination.
 */
export const hotkey = tool({
  id: "computer_hotkey",
  description: "Press a hotkey combination (e.g., 'ctrl+c', 'alt+tab')",
  parameters: z.object({
    keys: z
      .string()
      .describe("Hotkey combination (e.g., 'ctrl+c', 'cmd+shift+t')"),
  }),
  execute: async (ctx: Context<SandboxContext>, { keys }) => {
    const sandbox = await ensureDesktop(ctx);
    await sandbox.computerUse.keyboard.hotkey(keys);

    return { success: true };
  },
});

/**
 * Get display information.
 */
export const display = tool({
  id: "computer_display",
  description: "Get display information (resolution, etc.)",
  parameters: z.object({}),
  execute: async (ctx: Context<SandboxContext>) => {
    const sandbox = await ensureDesktop(ctx);
    return await sandbox.computerUse.display.getInfo();
  },
});

/**
 * List open windows.
 */
export const windows = tool({
  id: "computer_windows",
  description: "List open windows",
  parameters: z.object({}),
  execute: async (ctx: Context<SandboxContext>) => {
    const sandbox = await ensureDesktop(ctx);
    return await sandbox.computerUse.display.getWindows();
  },
});

export const computer = new Toolkit<SandboxContext>({
  id: "computer",
  description:
    "Desktop automation for Daytona sandboxes (mouse, keyboard, screenshots)",
  tools: [
    screenshot,
    click,
    move,
    drag,
    scroll,
    type,
    press,
    hotkey,
    display,
    windows,
  ],
});
