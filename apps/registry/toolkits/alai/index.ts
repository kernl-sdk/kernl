import { z } from "zod";
import { tool, Toolkit } from "kernl";
import { Alai } from "./client";

export const client = new Alai({
  apiKey: process.env.ALAI_API_KEY!,
});

const themeIds = [
  "NEBULA_DARK",
  "AMETHYST_LIGHT",
  "FLAT_WHITE",
  "DESERT_BLOOM",
  "LAPIS_DAWN",
  "EMERALD_FOREST",
  "COSMIC_THREAD",
  "DONUT",
  "OAK",
  "OBSIDIAN_FLOW",
  "MIDNIGHT_EMBER",
  "AURORA_FLUX",
] as const;

const languages = [
  "English (US)",
  "English (UK)",
  "Spanish (Latin America)",
  "Spanish (Mexico)",
  "Spanish (Spain)",
  "French",
  "German",
  "Italian",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Dutch",
  "Polish",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Hindi",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Greek",
  "Turkish",
  "Czech",
  "Hungarian",
  "Romanian",
  "Bulgarian",
  "Ukrainian",
  "Vietnamese",
  "Thai",
  "Indonesian",
] as const;

const tones = [
  "DEFAULT",
  "PROFESSIONAL",
  "CASUAL",
  "TECHNICAL",
  "EDUCATIONAL",
  "INSPIRATIONAL",
  "NARRATIVE",
  "PERSUASIVE",
  "AUTHORITATIVE",
  "EMPATHETIC",
  "CUSTOM",
] as const;

const contentModes = ["preserve", "enhance", "condense", "custom"] as const;
const amountModes = [
  "minimal",
  "essential",
  "balanced",
  "detailed",
  "custom",
] as const;
const imageStyles = [
  "auto",
  "realistic",
  "artistic",
  "cartoon",
  "three_d",
  "custom",
] as const;
const slideRanges = [
  "auto",
  "1",
  "2-5",
  "6-10",
  "11-15",
  "16-20",
  "21-25",
] as const;
const exportFormats = ["link", "id", "pdf"] as const;

/**
 * @tool
 *
 * Creates a presentation from text content using Alai's AI.
 */
export const createPresentation = tool({
  id: "alai_create_presentation",
  description:
    "Create a presentation from text content. Returns a URL to the presentation.",
  parameters: z.object({
    input_text: z
      .string()
      .describe("The main content for presentation generation"),
    additional_instructions: z
      .string()
      .optional()
      .describe("Custom AI instructions for generation"),
    title: z.string().optional().describe("Presentation title"),
    theme_id: z
      .enum(themeIds)
      .optional()
      .describe("Visual theme (default: AMETHYST_LIGHT)"),
    slide_range: z
      .enum(slideRanges)
      .optional()
      .describe("Target slide count (default: 6-10)"),
    choices_per_slide: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("Slide variants per slide (1-4, default: 1)"),
    export_as: z
      .enum(exportFormats)
      .optional()
      .describe("Response format: link (wait), id (async), or pdf"),
    language: z
      .enum(languages)
      .optional()
      .describe("Content language (default: English (US))"),
    tone: z
      .enum(tones)
      .optional()
      .describe("Writing tone (default: PROFESSIONAL)"),
    tone_instructions: z
      .string()
      .optional()
      .describe("Custom tone directives (when tone is CUSTOM)"),
    content_mode: z
      .enum(contentModes)
      .optional()
      .describe("Text processing mode (default: preserve)"),
    content_instructions: z
      .string()
      .optional()
      .describe("Custom content directives (when content_mode is custom)"),
    amount_mode: z
      .enum(amountModes)
      .optional()
      .describe("Text density per slide (default: essential)"),
    amount_instructions: z
      .string()
      .optional()
      .describe("Custom density directives (when amount_mode is custom)"),
    include_ai_images: z
      .boolean()
      .optional()
      .describe("Generate AI illustrations (default: true)"),
    style: z
      .enum(imageStyles)
      .optional()
      .describe("AI image style (default: auto)"),
    style_instructions: z
      .string()
      .optional()
      .describe("Custom image directives (when style is custom)"),
    image_urls: z
      .array(z.string().url())
      .optional()
      .describe("Image URLs to include in presentation"),
  }),
  execute: async (ctx, params) => client.createPresentation(params),
});

export const alai = new Toolkit({
  id: "alai",
  description: "Transform text content into fully designed presentations",
  tools: [createPresentation],
});
