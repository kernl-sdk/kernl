import { Hono } from "hono";
import {
  getAvailableModels,
  initModelsCache,
  type ProviderInfo,
  type ModelInfo,
} from "@/lib/models";
import * as providerStore from "@/state/providers";
import * as events from "@/state/events";
import * as anthropicOAuth from "@/lib/oauth/anthropic";
import * as openaiOAuth from "@/lib/oauth/openai";

export const providers = new Hono();

// Initialize models cache on module load
initModelsCache();

/**
 * Auth methods for each provider.
 */
const AUTH_METHODS: Record<string, Array<{ type: "oauth" | "api"; label: string }>> = {
  anthropic: [
    { type: "api", label: "Manually enter API Key" },
  ],
  openai: [
    { type: "oauth", label: "ChatGPT Pro/Plus" },
    { type: "api", label: "Manually enter API Key" },
  ],
  google: [
    { type: "api", label: "Manually enter API Key" },
  ],
};

// Store pending OpenAI OAuth flows for the auto callback
const pendingOpenAIFlows = new Map<
  string,
  { waitForCode: () => Promise<string | null>; cleanup: () => void }
>();

/**
 * Transform our internal model format to the SDK expected format.
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
 * Transform our internal provider format to the SDK expected format.
 */
function transformProvider(provider: ProviderInfo) {
  const models: Record<string, ReturnType<typeof transformModel>> = {};
  for (const [modelId, model] of Object.entries(provider.models)) {
    models[modelId] = transformModel(model);
  }

  return {
    id: provider.id,
    name: provider.name,
    env: provider.env,
    npm: provider.npm,
    models,
  };
}

/**
 * Get connected providers (those with env vars set or keys stored via TUI).
 */
function getConnectedProviders(
  providers: Record<string, ProviderInfo>,
): string[] {
  const connected: string[] = [];
  for (const [id, provider] of Object.entries(providers)) {
    // Check if any of the required env vars are set OR we have a stored key
    const hasEnv = provider.env.some((envVar) => process.env[envVar]);
    const hasStoredKey = providerStore.isConnected(id);
    if (hasEnv || hasStoredKey) {
      connected.push(id);
    }
  }
  return connected;
}

/**
 * Get default model for each provider.
 */
function getDefaultModels(
  providers: Record<string, ProviderInfo>,
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const [id, provider] of Object.entries(providers)) {
    const modelIds = Object.keys(provider.models);
    if (modelIds.length > 0) {
      // Prefer models with "sonnet", "4o", or "pro" in the name as defaults
      const preferred = modelIds.find(
        (m) =>
          m.includes("opus-4") ||
          m.includes("gpt-5.1") ||
          m.includes("gemini-2.5-pro"),
      );
      defaults[id] = preferred ?? modelIds[0];
    }
  }
  return defaults;
}

providers.get("/", async (cx) => {
  const availableProviders = await getAvailableModels();
  const connected = getConnectedProviders(availableProviders);
  const defaults = getDefaultModels(availableProviders);

  // Transform to SDK format
  const all = Object.values(availableProviders).map(transformProvider);

  return cx.json({
    all,
    connected,
    default: defaults,
  });
});

/**
 * Get auth methods for all providers.
 */
providers.get("/auth", (cx) => {
  return cx.json(AUTH_METHODS);
});

/**
 * Start OAuth authorization flow.
 */
providers.post("/:providerID/oauth/authorize", async (cx) => {
  const providerID = cx.req.param("providerID");
  const body = await cx.req.json().catch(() => ({}));
  const methodIndex = body.method ?? 0;

  const methods = AUTH_METHODS[providerID];
  if (!methods || !methods[methodIndex] || methods[methodIndex].type !== "oauth") {
    return cx.json({ error: "Invalid provider or method" }, 400);
  }

  if (providerID === "anthropic") {
    const result = anthropicOAuth.authorize();
    return cx.json({
      url: result.url,
      method: result.method,
      instructions: result.instructions,
    });
  }

  if (providerID === "openai") {
    const result = openaiOAuth.authorize();
    // Store the flow for callback
    pendingOpenAIFlows.set(result.state, {
      waitForCode: result.waitForCode,
      cleanup: result.cleanup,
    });
    return cx.json({
      url: result.url,
      method: result.method,
      instructions: result.instructions,
    });
  }

  return cx.json({ error: "OAuth not supported for this provider" }, 400);
});

/**
 * Complete OAuth callback.
 */
providers.post("/:providerID/oauth/callback", async (cx) => {
  const providerID = cx.req.param("providerID");
  const directory = cx.req.header("x-opencode-directory") ?? "";
  const body = await cx.req.json().catch(() => ({}));
  const code = body.code as string | undefined;

  if (providerID === "anthropic") {
    if (!code) {
      return cx.json({ error: "Missing authorization code" }, 400);
    }
    // For Anthropic, the state is embedded in the verifier
    // The code format is code#state, where state is the verifier
    const [, state] = code.split("#");
    if (!state) {
      return cx.json({ error: "Invalid code format" }, 400);
    }

    const result = await anthropicOAuth.callback(code, state);
    if (result.type === "failed") {
      return cx.json({ error: result.error }, 400);
    }

    // Store the OAuth tokens
    providerStore.setAuth(providerID, {
      type: "oauth",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    });

    events.emit(directory, {
      type: "provider.connected",
      properties: { providerID },
    });

    return cx.json({ success: true });
  }

  if (providerID === "openai") {
    // For OpenAI auto flow, we wait for the callback server to receive the code
    // Find the pending flow and wait for it
    for (const [state, flow] of pendingOpenAIFlows.entries()) {
      const receivedCode = await Promise.race([
        flow.waitForCode(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 120000)), // 2 min timeout
      ]);

      pendingOpenAIFlows.delete(state);

      if (!receivedCode) {
        flow.cleanup();
        return cx.json({ error: "Authorization timed out or failed" }, 400);
      }

      // Note: callback() handles its own cleanup of the pending auth
      const result = await openaiOAuth.callback(receivedCode, state);
      if (result.type === "failed") {
        return cx.json({ error: result.error }, 400);
      }

      // Store the OAuth tokens
      providerStore.setAuth(providerID, {
        type: "oauth",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        accountId: result.accountId,
      });

      events.emit(directory, {
        type: "provider.connected",
        properties: { providerID },
      });

      return cx.json({ success: true });
    }

    return cx.json({ error: "No pending authorization flow" }, 400);
  }

  return cx.json({ error: "OAuth not supported for this provider" }, 400);
});
