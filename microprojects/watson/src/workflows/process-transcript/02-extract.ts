import { extractor } from "@/agents/extractor";
import type { Transcript } from "@/types/transcript";
import type { MeetingInsights } from "@/types/insights";

/**
 * @step
 *
 * Extract structured insights from a transcript.
 *
 * Uses the extractor agent with structured output to return
 * typed, validated MeetingInsights.
 */
export async function extractInsights(
  transcript: Transcript,
): Promise<MeetingInsights> {
  "use step";

  const text = transcript.segments
    .map((s) => `${s.speaker_name}: ${s.text}`)
    .join("\n");

  const res = await extractor.run(text);
  return res.response;
}
