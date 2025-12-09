import type { MemoryRecord } from "kernl";

import { watson } from "@/agents/watson";
import type { Transcript } from "@/types/transcript";
import type { MeetingInsights } from "@/types/insights";

/**
 * @step
 *
 * Store meeting insights as a memory.
 *
 * Persists the extracted insights to Watson's memory system
 * for later retrieval during conversations.
 */
export async function createMemory(
  transcript: Transcript,
  insights: MeetingInsights,
): Promise<MemoryRecord> {
  "use step";

  // (TODO): we need to start storing meetings in DB to get the real meeting ID

  return watson.memories.create({
    entityId: `meeting:${transcript.id}`, // (TODO): actual meeting id
    collection: "meetings",
    content: {
      text: insights.summary,
      object: insights,
    },
    timestamp: Date.now(),
    metadata: {
      meetingId: transcript.id, // TODO: this should be the actual meeting ID
      title: transcript.title,
      date: transcript.timestamp,
    },
  });
}
