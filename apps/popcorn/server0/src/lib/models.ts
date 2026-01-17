import { anthropic, createAnthropic } from "@kernl-sdk/ai/anthropic";
import { openai, createOpenAI } from "@kernl-sdk/ai/openai";
import { google } from "@kernl-sdk/ai/google";
import type { LanguageModel } from "@kernl-sdk/protocol";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import * as providerStore from "@/state/providers";

/**
 * Supported provider IDs that we can create LanguageModel instances for.
 */
const SUPPORTED_PROVIDERS = ["anthropic", "openai", "google"] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

/**
 * Provider factory functions that create LanguageModel instances.
 */
const providerFactories: Record<
  SupportedProvider,
  (modelId: string) => LanguageModel
> = {
  anthropic,
  openai,
  google,
};

/**
 * Model info from models.dev API.
 */
export interface ModelInfo {
  id: string;
  name: string;
  family?: string;
  attachment?: boolean;
  reasoning?: boolean;
  temperature?: boolean;
  tool_call?: boolean;
  knowledge?: string;
  release_date?: string;
  cost: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  limit: {
    context: number;
    output: number;
  };
  modalities?: {
    input: string[];
    output: string[];
  };
}

/**
 * Provider info with models.
 */
export interface ProviderInfo {
  id: string;
  name: string;
  env: string[];
  npm: string;
  models: Record<string, ModelInfo>;
}

/**
 * Cache configuration.
 */
const CACHE_DIR = join(homedir(), ".kernl", "cache");
const CACHE_FILE = join(CACHE_DIR, "models.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes
const MODELS_DEV_URL = "https://models.dev/api.json";

/**
 * In-memory cache of providers.
 */
let cachedProviders: Record<string, ProviderInfo> | null = null;
let cacheTimestamp = 0;

/**
 * Ensure cache directory exists.
 */
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read cached data from disk.
 */
function readCache(): {
  data: Record<string, ProviderInfo>;
  timestamp: number;
} | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const content = readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed.data && typeof parsed.timestamp === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write data to disk cache.
 */
function writeCache(data: Record<string, ProviderInfo>) {
  try {
    ensureCacheDir();
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ data, timestamp: Date.now() }, null, 2),
    );
  } catch (err) {
    console.error("[models] Failed to write cache:", err);
  }
}

/**
 * Map from provider.npm to our provider ID.
 */
const NPM_TO_PROVIDER: Record<string, SupportedProvider> = {
  "@ai-sdk/anthropic": "anthropic",
  "@ai-sdk/openai": "openai",
  "@ai-sdk/google": "google",
};

/**
 * Fetch models from models.dev and filter to supported providers.
 */
async function fetchModels(): Promise<Record<string, ProviderInfo>> {
  const response = await fetch(MODELS_DEV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch models.dev: ${response.status}`);
  }

  const allProviders = (await response.json()) as Record<string, any>;

  // The "opencode" provider has curated models with provider.npm field
  const opencodeProvider = allProviders["opencode"];
  if (!opencodeProvider?.models) {
    console.error(
      "[models] No opencode provider found. Available providers:",
      Object.keys(allProviders),
    );
    throw new Error("No opencode provider found in models.dev response");
  }

  // Group models by provider (determined by provider.npm field)
  const result: Record<string, ProviderInfo> = {};

  for (const [modelId, modelData] of Object.entries(
    opencodeProvider.models,
  ) as [string, any][]) {
    // Get provider from the provider.npm field
    const npm = modelData.provider?.npm;
    if (!npm) continue;

    // Skip alpha/experimental models (often incorrect data)
    if (modelData.status === "alpha") continue;

    const providerID = NPM_TO_PROVIDER[npm];
    if (!providerID) continue;

    // Initialize provider if needed
    if (!result[providerID]) {
      const sourceProvider = allProviders[providerID];
      result[providerID] = {
        id: providerID,
        name: sourceProvider?.name ?? providerID,
        env: sourceProvider?.env ?? [],
        npm: sourceProvider?.npm ?? npm,
        models: {},
      };
    }

    // Add model to provider
    result[providerID].models[modelId] = {
      id: modelId,
      name: modelData.name ?? modelId,
      family: modelData.family,
      attachment: modelData.attachment,
      reasoning: modelData.reasoning,
      temperature: modelData.temperature,
      tool_call: modelData.tool_call,
      knowledge: modelData.knowledge,
      release_date: modelData.release_date,
      cost: {
        input: modelData.cost?.input ?? 0,
        output: modelData.cost?.output ?? 0,
        cache_read: modelData.cost?.cache_read,
        cache_write: modelData.cost?.cache_write,
      },
      limit: {
        context: modelData.limit?.context ?? 0,
        output: modelData.limit?.output ?? 0,
      },
      modalities: modelData.modalities,
    };
  }

  return result;
}

/**
 * Get available providers and models, using cache when possible.
 */
export async function getAvailableModels(): Promise<
  Record<string, ProviderInfo>
> {
  const now = Date.now();

  // Check in-memory cache first
  if (cachedProviders && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProviders;
  }

  // Check disk cache
  const diskCache = readCache();
  if (diskCache && now - diskCache.timestamp < CACHE_TTL_MS) {
    cachedProviders = diskCache.data;
    cacheTimestamp = diskCache.timestamp;
    return cachedProviders;
  }

  // Fetch fresh data
  try {
    const providers = await fetchModels();
    cachedProviders = providers;
    cacheTimestamp = now;
    writeCache(providers);
    return providers;
  } catch (err) {
    console.error("[models] Failed to fetch models:", err);

    // Fall back to disk cache if available (even if stale)
    if (diskCache) {
      console.log("[models] Using stale cache as fallback");
      cachedProviders = diskCache.data;
      cacheTimestamp = diskCache.timestamp;
      return cachedProviders;
    }

    // Return minimal fallback
    return getFallbackModels();
  }
}

/**
 * Get available models synchronously (returns cached data or fallback).
 */
export function getAvailableModelsSync(): Record<string, ProviderInfo> {
  if (cachedProviders) {
    return cachedProviders;
  }

  const diskCache = readCache();
  if (diskCache) {
    cachedProviders = diskCache.data;
    cacheTimestamp = diskCache.timestamp;
    return cachedProviders;
  }

  return getFallbackModels();
}

/**
 * Fallback models when fetch fails and no cache exists.
 */
function getFallbackModels(): Record<string, ProviderInfo> {
  return {
    anthropic: {
      id: "anthropic",
      name: "Anthropic",
      env: ["ANTHROPIC_API_KEY"],
      npm: "@ai-sdk/anthropic",
      models: {
        "claude-sonnet-4-20250514": {
          id: "claude-sonnet-4-20250514",
          name: "Claude Sonnet 4",
          reasoning: false,
          tool_call: true,
          cost: { input: 3, output: 15 },
          limit: { context: 200000, output: 16000 },
        },
      },
    },
  };
}

/**
 * Create a LanguageModel instance from provider and model IDs.
 * Uses OAuth credentials if available, otherwise falls back to env vars.
 *
 * @param providerID - Provider ID (e.g., "anthropic", "openai", "google")
 * @param modelID - Model ID (e.g., "claude-sonnet-4", "gpt-4o")
 * @returns LanguageModel instance or undefined if provider not supported
 */
export function createModel(
  providerID: string,
  modelID: string,
): LanguageModel | undefined {
  // Check for OAuth auth first
  const auth = providerStore.getAuth(providerID);

  if (auth?.type === "oauth" && providerID === "openai") {
    // Use OAuth-aware OpenAI provider
    try {
      const oauthOpenAI = createOpenAI({
        oauth: {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAt: auth.expiresAt,
          accountId: auth.accountId,
          onRefresh: (tokens) => {
            // Update stored tokens when refreshed
            providerStore.setAuth(providerID, {
              type: "oauth",
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
              accountId: auth.accountId,
            });
          },
        },
      });
      return oauthOpenAI(modelID);
    } catch (err) {
      console.error(
        `[models] Failed to create OAuth model ${providerID}/${modelID}:`,
        err,
      );
      return undefined;
    }
  }

  // NOTE: Anthropic OAuth disabled - they block non-Claude-Code clients.
  // Keeping this code commented for reference if they open it up later.
  // if (auth?.type === "oauth" && providerID === "anthropic") {
  //   const oauthAnthropic = createAnthropic({
  //     oauth: {
  //       accessToken: auth.accessToken,
  //       refreshToken: auth.refreshToken,
  //       expiresAt: auth.expiresAt,
  //       onRefresh: (tokens: { accessToken: string; refreshToken: string; expiresAt: number }) => {
  //         providerStore.setAuth(providerID, {
  //           type: "oauth",
  //           accessToken: tokens.accessToken,
  //           refreshToken: tokens.refreshToken,
  //           expiresAt: tokens.expiresAt,
  //         });
  //       },
  //     },
  //   });
  //   return oauthAnthropic(modelID);
  // }

  // Fall back to default factory (uses env vars)
  const factory = providerFactories[providerID as SupportedProvider];
  if (!factory) {
    console.warn(`[models] Unsupported provider: ${providerID}`);
    return undefined;
  }

  try {
    return factory(modelID);
  } catch (err) {
    console.error(
      `[models] Failed to create model ${providerID}/${modelID}:`,
      err,
    );
    return undefined;
  }
}

/**
 * Check if a provider is supported.
 */
export function isProviderSupported(providerID: string): boolean {
  return SUPPORTED_PROVIDERS.includes(providerID as SupportedProvider);
}

/**
 * Initialize models cache on startup (fire and forget).
 */
export function initModelsCache(): void {
  getAvailableModels().catch((err) => {
    console.error("[models] Failed to initialize cache:", err);
  });
}
