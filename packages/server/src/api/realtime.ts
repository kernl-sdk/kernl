import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { openai } from "@kernl-sdk/openai";
import { xai } from "@kernl-sdk/xai";

import { ValidationError } from "@/lib/error";
import type { Variables } from "@/types";

const CredentialBody = z.object({
  provider: z.string(),
  modelId: z.string(),
  agentId: z.string().optional(),
});

export const realtime = new Hono<{ Variables: Variables }>();

/**
 * POST /realtime/credential
 *
 * Get ephemeral credential for browser-side realtime connection.
 */
realtime.post("/credential", zValidator("json", CredentialBody), async (c) => {
  const { provider, modelId, agentId } = c.req.valid("json");

  let credential;

  switch (provider) {
    case "openai": {
      const model = openai.realtime(modelId);
      credential = await model.authenticate();
      break;
    }
    case "xai": {
      const model = xai.realtime();
      credential = await model.authenticate();
      break;
    }
    default:
      throw new ValidationError(`Unsupported realtime provider: ${provider}`);
  }

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
