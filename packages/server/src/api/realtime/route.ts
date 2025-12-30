import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { openai } from "@kernl-sdk/openai";

import { ValidationError } from "@/lib/error";
import type { Variables } from "@/types";

export const realtime = new Hono<{ Variables: Variables }>();

const CredentialBody = z.object({
  provider: z.string(),
  modelId: z.string(),
});

/**
 * POST /realtime/credential
 *
 * Get ephemeral credential for browser-side realtime connection.
 */
realtime.post("/credential", zValidator("json", CredentialBody), async (c) => {
  const { provider, modelId } = c.req.valid("json");

  // Create model based on provider
  let model;
  switch (provider) {
    case "openai":
      model = openai.realtime(modelId);
      break;
    default:
      throw new ValidationError(`Unsupported realtime provider: ${provider}`);
  }

  const credential = await model.authenticate();

  // Handle different credential types
  if (credential.kind === "token") {
    return c.json({
      credential: {
        kind: credential.kind,
        token: credential.token,
        expiresAt: credential.expiresAt.toISOString(),
      },
    });
  } else {
    return c.json({
      credential: {
        kind: credential.kind,
        url: credential.url,
        expiresAt: credential.expiresAt.toISOString(),
      },
    });
  }
});
