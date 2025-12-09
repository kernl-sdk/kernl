import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { MeetingInsightsSchema } from "@/types/insights";

/**
 * Insights extractor agent.
 *
 * Analyzes customer call transcripts and returns structured insights
 * with typed output via output schema.
 */
export const extractor = new Agent({
  id: "extractor",
  name: "Insights Extractor",
  description: "Extracts structured insights from customer call transcripts",
  instructions: `Analyze this customer call transcript and extract structured insights.

Extract:
- summary: 2-3 sentence overview of the call
- jtbd: jobs-to-be-done (job, context, outcome, quote)
- painPoints: pain points (description, severity: low/medium/high, quote)
- objections: objections raised (description, category, quote)
- desiredOutcomes: what the customer wants to achieve
- featureMentions: features mentioned (feature, sentiment: positive/negative/neutral/requested, quote)
- keyQuotes: notable direct quotes from the customer`,
  model: anthropic("claude-sonnet-4-5"),
  output: MeetingInsightsSchema,
});
