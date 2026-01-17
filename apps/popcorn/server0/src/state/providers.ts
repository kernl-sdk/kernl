/**
 * Provider authentication store.
 * Supports both API keys and OAuth tokens.
 * Persists to disk at ~/.kernl/auth.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface ApiKeyAuth {
  type: "api";
  key: string;
}

export interface OAuthAuth {
  type: "oauth";
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountId?: string; // For OpenAI org subscriptions
}

export type ProviderAuth = ApiKeyAuth | OAuthAuth;

/**
 * Get XDG data directory.
 * - Linux: ~/.local/share
 * - macOS: ~/Library/Application Support
 */
function getXdgDataDir(): string {
  if (process.env.XDG_DATA_HOME) {
    return process.env.XDG_DATA_HOME;
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support");
  }
  return join(homedir(), ".local", "share");
}

/**
 * Path to auth file.
 */
const AUTH_DIR = join(getXdgDataDir(), "popcorn");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

/**
 * In-memory cache of provider auth.
 */
const authStore: Map<string, ProviderAuth> = new Map();

/**
 * Load auth from disk on module init.
 */
function loadFromDisk(): void {
  try {
    if (!existsSync(AUTH_FILE)) {
      return;
    }
    const content = readFileSync(AUTH_FILE, "utf-8");
    const data = JSON.parse(content) as Record<string, ProviderAuth>;
    for (const [providerId, auth] of Object.entries(data)) {
      authStore.set(providerId, auth);
    }
  } catch {
    // Ignore errors loading auth
  }
}

/**
 * Save auth to disk.
 */
function saveToDisk(): void {
  try {
    // Ensure directory exists
    if (!existsSync(AUTH_DIR)) {
      mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Convert map to object
    const data: Record<string, ProviderAuth> = {};
    for (const [providerId, auth] of authStore.entries()) {
      data[providerId] = auth;
    }

    // Write and set permissions (owner read/write only)
    writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), "utf-8");
    chmodSync(AUTH_FILE, 0o600);
  } catch {
    // Ignore errors saving auth
  }
}

// Load on module init
loadFromDisk();

/**
 * Store auth for a provider.
 */
export function setAuth(providerId: string, auth: ProviderAuth): void {
  authStore.set(providerId, auth);
  saveToDisk();
}

/**
 * Get auth for a provider.
 */
export function getAuth(providerId: string): ProviderAuth | undefined {
  return authStore.get(providerId);
}

/**
 * Remove auth for a provider.
 */
export function removeAuth(providerId: string): void {
  authStore.delete(providerId);
  saveToDisk();
}

/**
 * Check if a provider is connected (has any auth).
 */
export function isConnected(providerId: string): boolean {
  return authStore.has(providerId);
}

// Legacy API for backwards compatibility
export function connect(providerId: string, apiKey: string): void {
  setAuth(providerId, { type: "api", key: apiKey });
}

export function disconnect(providerId: string): void {
  removeAuth(providerId);
}

export function getKey(providerId: string): string | undefined {
  const auth = getAuth(providerId);
  if (auth?.type === "api") {
    return auth.key;
  }
  return undefined;
}
