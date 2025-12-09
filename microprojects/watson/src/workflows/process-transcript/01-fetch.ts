import { Fireflies } from "@/lib/fireflies/client";
import { env } from "@/lib/env";
import type { Transcript } from "@/types/transcript";

/**
 * @step
 *
 * Fetch a transcript from Fireflies by ID.
 *
 * Returns normalized Transcript with speakers and segments.
 */
export async function fetchTranscript(
  transcriptId: string,
): Promise<Transcript> {
  "use step";

  const ff = new Fireflies({ apiKey: env.FIREFLIES_API_KEY! });
  return ff.transcripts.get(transcriptId);
}
