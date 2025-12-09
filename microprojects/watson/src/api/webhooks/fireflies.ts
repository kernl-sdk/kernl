import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { logger } from "@/lib/logger";
import { processTranscript } from "@/workflows/process-transcript";

const WebhookPayload = z.object({
  transcriptId: z.string(),
  meetingId: z.string().optional(),
  eventType: z.string().optional(),
});

const webhooks = new Hono();

/**
 * POST /webhooks/fireflies
 *
 * Webhook endpoint for Fireflies transcript notifications.
 * Enqueues the process-transcript workflow.
 */
webhooks.post("/", zValidator("json", WebhookPayload), async (c) => {
  const { transcriptId } = c.req.valid("json");

  logger.info({ transcriptId }, "Received Fireflies webhook");

  await processTranscript({ transcriptId });

  return c.json({ ok: true, transcriptId }, 202);
});

export default webhooks;
