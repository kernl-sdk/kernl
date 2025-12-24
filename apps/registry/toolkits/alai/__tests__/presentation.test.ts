import { describe, it, expect } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials } from "./setup";

import { createPresentation } from "../index";

describe.skipIf(skipIfNoCredentials())("alai presentations", () => {
  const ctx = new Context();

  it(
    "creates presentation with full configuration",
    { timeout: 120000 },
    async () => {
      const result = await createPresentation.invoke(
        ctx,
        JSON.stringify({
          input_text: `
            Q4 2024 Sales Report

            Revenue increased 25% year-over-year, driven by strong performance
            in the enterprise segment. Key highlights include:

            - New customer acquisitions up 40%
            - Customer retention rate at 95%
            - Average deal size increased by 15%

            Regional breakdown shows EMEA leading growth at 35%, followed by
            APAC at 28% and Americas at 20%.
          `,
          title: `Integration Test ${Date.now()}`,
          theme_id: "NEBULA_DARK",
          slide_range: "2-5",
          language: "English (US)",
          tone: "PROFESSIONAL",
          content_mode: "enhance",
          amount_mode: "balanced",
          include_ai_images: false,
          export_as: "link",
        }),
      );

      expect(result.state).toBe("completed");
      const presentation = result.result as any;

      // Verify response structure
      expect(presentation.presentation_url).toBeDefined();
      expect(presentation.presentation_url).toMatch(/^https?:\/\//);
      expect(presentation.presentation_id).toBeDefined();
      expect(typeof presentation.presentation_id).toBe("string");

      console.log(
        `\n✅ Created presentation: ${presentation.presentation_url}\n`,
      );
    },
  );

  it(
    "creates minimal presentation with only required params",
    { timeout: 120000 },
    async () => {
      const result = await createPresentation.invoke(
        ctx,
        JSON.stringify({
          input_text: "Simple test content for minimal presentation.",
        }),
      );

      expect(result.state).toBe("completed");
      const presentation = result.result as any;
      expect(presentation.presentation_url).toBeDefined();
      expect(presentation.presentation_id).toBeDefined();

      console.log(
        `✅ Created minimal presentation: ${presentation.presentation_id}\n`,
      );
    },
  );

  it(
    "handles custom tone and content instructions",
    { timeout: 120000 },
    async () => {
      const result = await createPresentation.invoke(
        ctx,
        JSON.stringify({
          input_text:
            "Product launch announcement for our new AI-powered analytics platform.",
          additional_instructions:
            "Focus on key differentiators and market positioning",
          tone: "CUSTOM",
          tone_instructions: "Enthusiastic but not hyperbolic, data-driven",
          content_mode: "custom",
          content_instructions:
            "Emphasize technical capabilities over marketing speak",
          slide_range: "1",
          include_ai_images: false,
        }),
      );

      expect(result.state).toBe("completed");
      const presentation = result.result as any;
      expect(presentation.presentation_url).toBeDefined();

      console.log(`✅ Created custom-configured presentation\n`);
    },
  );
});
