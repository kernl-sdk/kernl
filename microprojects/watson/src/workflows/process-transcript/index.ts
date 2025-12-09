import { fetchTranscript } from "./01-fetch";
import { extractInsights } from "./02-extract";
import { createMemory } from "./03-store";

export interface ProcessTranscriptInput {
  transcriptId: string;
}

export interface ProcessTranscriptOutput {
  meetingId: string;
  title?: string;
  summary: string;
}

/**
 * @workflow
 *
 * Process a transcript from Fireflies.
 *
 * Fetches the raw transcript, extracts structured insights via Watson,
 * and stores them as memories for later retrieval.
 */
export async function processTranscript(
  input: ProcessTranscriptInput,
): Promise<ProcessTranscriptOutput> {
  "use workflow";

  const transcript = await fetchTranscript(input.transcriptId);
  const insights = await extractInsights(transcript);
  const mem = await createMemory(transcript, insights);

  return {
    meetingId: transcript.id,
    title: transcript.title,
    summary: insights.summary,
  };
}
