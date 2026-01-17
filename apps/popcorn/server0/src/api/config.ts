import { Hono } from "hono";
import {
  getAvailableModels,
  type ProviderInfo,
  type ModelInfo,
} from "@/lib/models";
import * as providers from "@/state/providers";

export const config = new Hono();

// Default keybinds from opencode - these are required for the TUI to function properly
const defaultKeybinds = {
  leader: "ctrl+x",
  app_exit: "ctrl+c,ctrl+d,<leader>q",
  editor_open: "<leader>e",
  theme_list: "<leader>t",
  sidebar_toggle: "<leader>b",
  scrollbar_toggle: "none",
  username_toggle: "none",
  status_view: "<leader>s",
  session_export: "<leader>x",
  session_new: "<leader>n",
  session_list: "<leader>l",
  session_timeline: "<leader>g",
  session_fork: "none",
  session_rename: "none",
  session_share: "none",
  session_unshare: "none",
  session_interrupt: "escape",
  session_compact: "<leader>c",
  messages_page_up: "pageup",
  messages_page_down: "pagedown",
  messages_half_page_up: "ctrl+alt+u",
  messages_half_page_down: "ctrl+alt+d",
  messages_first: "ctrl+g,home",
  messages_last: "ctrl+alt+g,end",
  messages_next: "none",
  messages_previous: "none",
  messages_last_user: "none",
  messages_copy: "<leader>y",
  messages_undo: "<leader>u",
  messages_redo: "<leader>r",
  messages_toggle_conceal: "<leader>h",
  tool_details: "none",
  model_list: "<leader>m",
  model_cycle_recent: "f2",
  model_cycle_recent_reverse: "shift+f2",
  model_cycle_favorite: "none",
  model_cycle_favorite_reverse: "none",
  command_list: "ctrl+p",
  agent_list: "<leader>a",
  agent_cycle: "tab",
  agent_cycle_reverse: "shift+tab",
  variant_cycle: "ctrl+t",
  input_clear: "ctrl+c",
  input_paste: "ctrl+v",
  input_submit: "return",
  input_newline: "shift+return,ctrl+return,alt+return,ctrl+j",
  input_move_left: "left,ctrl+b",
  input_move_right: "right,ctrl+f",
  input_move_up: "up",
  input_move_down: "down",
  input_select_left: "shift+left",
  input_select_right: "shift+right",
  input_select_up: "shift+up",
  input_select_down: "shift+down",
  input_line_home: "ctrl+a",
  input_line_end: "ctrl+e",
  input_select_line_home: "ctrl+shift+a",
  input_select_line_end: "ctrl+shift+e",
  input_visual_line_home: "alt+a",
  input_visual_line_end: "alt+e",
  input_select_visual_line_home: "alt+shift+a",
  input_select_visual_line_end: "alt+shift+e",
  input_buffer_home: "home",
  input_buffer_end: "end",
  input_select_buffer_home: "shift+home",
  input_select_buffer_end: "shift+end",
  input_delete_line: "ctrl+shift+d",
  input_delete_to_line_end: "ctrl+k",
  input_delete_to_line_start: "ctrl+u",
  input_backspace: "backspace,shift+backspace",
  input_delete: "ctrl+d,delete,shift+delete",
  input_undo: "ctrl+-,super+z",
  input_redo: "ctrl+.,super+shift+z",
  input_word_forward: "alt+f,alt+right,ctrl+right",
  input_word_backward: "alt+b,alt+left,ctrl+left",
  input_select_word_forward: "alt+shift+f,alt+shift+right",
  input_select_word_backward: "alt+shift+b,alt+shift+left",
  input_delete_word_forward: "alt+d,alt+delete,ctrl+delete",
  input_delete_word_backward: "ctrl+w,ctrl+backspace,alt+backspace",
  history_previous: "up",
  history_next: "down",
  session_child_cycle: "<leader>right",
  session_child_cycle_reverse: "<leader>left",
  session_parent: "<leader>up",
  terminal_suspend: "ctrl+z",
  terminal_title_toggle: "none",
  tips_toggle: "<leader>h",
};

config.get("/", (cx) => {
  return cx.json({
    keybinds: defaultKeybinds,
  });
});

/**
 * Transform model info to the format expected by the TUI.
 */
function transformModel(model: ModelInfo) {
  return {
    id: model.id,
    name: model.name,
    family: model.family,
    release_date: model.release_date ?? "",
    attachment: model.attachment ?? false,
    reasoning: model.reasoning ?? false,
    temperature: model.temperature ?? true,
    tool_call: model.tool_call ?? true,
    interleaved: false,
    cost: model.cost,
    limit: model.limit,
    modalities: model.modalities,
    options: {},
    headers: {},
  };
}

/**
 * Transform provider info to the format expected by the TUI.
 */
function transformProvider(provider: ProviderInfo) {
  const models: Record<string, ReturnType<typeof transformModel>> = {};
  for (const [modelId, model] of Object.entries(provider.models)) {
    models[modelId] = transformModel(model);
  }

  return {
    id: provider.id,
    name: provider.name,
    source: "env" as const,
    env: provider.env,
    options: {},
    models,
  };
}

/**
 * Filter to only connected providers (those with env vars set or TUI-connected).
 */
function filterConnected(
  allProviders: Record<string, ProviderInfo>,
): Record<string, ProviderInfo> {
  const connected: Record<string, ProviderInfo> = {};
  for (const [id, provider] of Object.entries(allProviders)) {
    const hasEnv = provider.env.some((envVar) => process.env[envVar]);
    const hasStoredKey = providers.isConnected(id);
    if (hasEnv || hasStoredKey) {
      connected[id] = provider;
    }
  }
  return connected;
}

/**
 * Get default model for each provider.
 */
function getDefaultModels(
  allProviders: Record<string, ProviderInfo>,
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const [id, provider] of Object.entries(allProviders)) {
    const modelIds = Object.keys(provider.models);
    if (modelIds.length > 0) {
      // Prefer models with "sonnet-4", "gpt-4o", or "pro" in the name as defaults
      const preferred = modelIds.find(
        (m) =>
          m.includes("sonnet-4") ||
          m.includes("gpt-4o") ||
          m.includes("gemini-2.5-pro"),
      );
      defaults[id] = preferred ?? modelIds[0];
    }
  }
  return defaults;
}

config.get("/providers", async (cx) => {
  const availableProviders = await getAvailableModels();
  const connectedProviders = filterConnected(availableProviders);
  const defaults = getDefaultModels(connectedProviders);

  // Return only connected providers
  const transformed = Object.values(connectedProviders).map(transformProvider);

  return cx.json({
    providers: transformed,
    default: defaults,
  });
});
