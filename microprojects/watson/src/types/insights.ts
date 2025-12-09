import { z } from "zod";

export const JTBDSchema = z.object({
  job: z.string(),
  context: z.string(),
  outcome: z.string(),
  quote: z.string().optional(),
});

export const PainPointSchema = z.object({
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  quote: z.string().optional(),
});

export const ObjectionSchema = z.object({
  description: z.string(),
  category: z.enum(["price", "timing", "trust", "complexity", "other"]).optional(),
  quote: z.string().optional(),
});

export const FeatureMentionSchema = z.object({
  feature: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral", "requested"]),
  quote: z.string().optional(),
});

export const MeetingInsightsSchema = z.object({
  summary: z.string(),
  jtbd: z.array(JTBDSchema),
  painPoints: z.array(PainPointSchema),
  objections: z.array(ObjectionSchema),
  desiredOutcomes: z.array(z.string()),
  featureMentions: z.array(FeatureMentionSchema),
  keyQuotes: z.array(z.string()).optional(),
});

export type JTBD = z.infer<typeof JTBDSchema>;
export type PainPoint = z.infer<typeof PainPointSchema>;
export type Objection = z.infer<typeof ObjectionSchema>;
export type FeatureMention = z.infer<typeof FeatureMentionSchema>;
export type MeetingInsights = z.infer<typeof MeetingInsightsSchema>;
