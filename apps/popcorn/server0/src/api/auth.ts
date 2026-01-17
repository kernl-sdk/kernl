import { Hono } from "hono";
import { getAvailableModels } from "@/lib/models";
import * as providers from "@/state/providers";
import * as events from "@/state/events";

export const auth = new Hono();

/**
 * Get auth for a provider.
 */
auth.get("/:providerID", (cx) => {
  const providerID = cx.req.param("providerID");
  const authData = providers.getAuth(providerID);

  if (!authData) {
    return cx.json(null);
  }

  // Return the full auth data (type, key for API, tokens for OAuth)
  if (authData.type === "api") {
    return cx.json({
      type: "api",
      key: authData.key,
    });
  }

  return cx.json({
    type: "oauth",
    access: authData.accessToken,
    refresh: authData.refreshToken,
    expires: authData.expiresAt,
    accountId: authData.accountId,
  });
});

/**
 * Set auth for a provider (connect).
 */
auth.put("/:providerID", async (cx) => {
  const providerID = cx.req.param("providerID");
  const directory = cx.req.header("x-opencode-directory") ?? "";
  const body = await cx.req.json().catch(() => ({}));

  // Accept both { auth: { ... } } and { ... } formats
  const authData = body.auth ?? body;

  if (!authData || !authData.type) {
    events.emit(directory, {
      type: "app.error",
      properties: {
        error: {
          name: "ValidationError",
          data: { message: "Invalid auth payload - missing type" },
        },
      },
    });
    return cx.json({ error: "Invalid auth payload" }, 400);
  }

  if (authData.type === "api") {
    if (!authData.key) {
      return cx.json({ error: "Missing API key" }, 400);
    }

    providers.setAuth(providerID, {
      type: "api",
      key: authData.key,
    });

    // Also set it in process.env so the AI SDK can use it
    const allProviders = await getAvailableModels();
    const provider = allProviders[providerID];
    if (provider?.env?.[0]) {
      process.env[provider.env[0]] = authData.key;
    }
  } else if (authData.type === "oauth") {
    providers.setAuth(providerID, {
      type: "oauth",
      accessToken: authData.access,
      refreshToken: authData.refresh,
      expiresAt: authData.expires,
      accountId: authData.accountId,
    });
  } else {
    return cx.json({ error: "Invalid auth type" }, 400);
  }

  // Emit event to notify TUI that providers changed
  events.emit(directory, {
    type: "provider.connected",
    properties: { providerID },
  });

  return cx.json(true);
});

/**
 * Remove auth for a provider (disconnect).
 */
auth.delete("/:providerID", async (cx) => {
  const providerID = cx.req.param("providerID");

  providers.removeAuth(providerID);

  // Also remove from process.env
  const allProviders = await getAvailableModels();
  const provider = allProviders[providerID];
  if (provider?.env?.[0]) {
    delete process.env[provider.env[0]];
  }

  return cx.json(true);
});
