const BASE_URL = "https://slides-api.getalai.com/api/v1";

export type ThemeId =
  | "NEBULA_DARK"
  | "AMETHYST_LIGHT"
  | "FLAT_WHITE"
  | "DESERT_BLOOM"
  | "LAPIS_DAWN"
  | "EMERALD_FOREST"
  | "COSMIC_THREAD"
  | "DONUT"
  | "OAK"
  | "OBSIDIAN_FLOW"
  | "MIDNIGHT_EMBER"
  | "AURORA_FLUX";

export type Language =
  | "English (US)"
  | "English (UK)"
  | "Spanish (Latin America)"
  | "Spanish (Mexico)"
  | "Spanish (Spain)"
  | "French"
  | "German"
  | "Italian"
  | "Portuguese (Brazil)"
  | "Portuguese (Portugal)"
  | "Dutch"
  | "Polish"
  | "Russian"
  | "Japanese"
  | "Korean"
  | "Chinese (Simplified)"
  | "Hindi"
  | "Swedish"
  | "Norwegian"
  | "Danish"
  | "Finnish"
  | "Greek"
  | "Turkish"
  | "Czech"
  | "Hungarian"
  | "Romanian"
  | "Bulgarian"
  | "Ukrainian"
  | "Vietnamese"
  | "Thai"
  | "Indonesian";

export type Tone =
  | "DEFAULT"
  | "PROFESSIONAL"
  | "CASUAL"
  | "TECHNICAL"
  | "EDUCATIONAL"
  | "INSPIRATIONAL"
  | "NARRATIVE"
  | "PERSUASIVE"
  | "AUTHORITATIVE"
  | "EMPATHETIC"
  | "CUSTOM";

export type ContentMode = "preserve" | "enhance" | "condense" | "custom";
export type AmountMode = "minimal" | "essential" | "balanced" | "detailed" | "custom";
export type ImageStyle = "auto" | "realistic" | "artistic" | "cartoon" | "three_d" | "custom";
export type SlideRange = "auto" | "1" | "2-5" | "6-10" | "11-15" | "16-20" | "21-25";
export type ExportFormat = "link" | "id" | "pdf";

export interface CreatePresentationParams {
  input_text: string;
  additional_instructions?: string;
  title?: string;
  theme_id?: ThemeId;
  slide_range?: SlideRange;
  choices_per_slide?: 1 | 2 | 3 | 4;
  export_as?: ExportFormat;
  language?: Language;
  tone?: Tone;
  tone_instructions?: string;
  content_mode?: ContentMode;
  content_instructions?: string;
  amount_mode?: AmountMode;
  amount_instructions?: string;
  include_ai_images?: boolean;
  style?: ImageStyle;
  style_instructions?: string;
  image_urls?: string[];
}

export interface CreatePresentationResponse {
  presentation_url: string;
  presentation_id: string;
}

export interface AlaiConfig {
  apiKey: string;
}

/**
 * Error thrown when the Alai API returns a non-OK response.
 */
export class AlaiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AlaiError";
  }
}

/**
 * Client for the Alai API.
 *
 * @example
 * ```ts
 * const alai = new Alai({ apiKey: process.env.ALAI_API_KEY! });
 * const presentation = await alai.createPresentation({
 *   input_text: "Quarterly sales increased 25% YoY...",
 *   title: "Q4 Sales Report",
 *   theme_id: "NEBULA_DARK",
 * });
 * console.log(presentation.presentation_url);
 * ```
 */
export class Alai {
  private apiKey: string;

  constructor(config: AlaiConfig) {
    this.apiKey = config.apiKey;
  }

  /**
   * Create a presentation from text content.
   *
   * @param params - Presentation generation parameters
   * @returns URL and ID of the generated presentation
   * @throws {AlaiError} When the API returns an error response
   */
  async createPresentation(params: CreatePresentationParams): Promise<CreatePresentationResponse> {
    const body = this.buildCreatePresentationBody(params);
    return this.request<CreatePresentationResponse>("POST", "/generations", body);
  }

  /**
   * Make an authenticated request to the Alai API.
   */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AlaiError(`Alai API error: ${error}`, response.status);
    }

    return response.json();
  }

  private buildCreatePresentationBody(params: CreatePresentationParams): Record<string, unknown> {
    const body: Record<string, unknown> = {
      input_text: params.input_text,
    };

    if (params.additional_instructions) {
      body.additional_instructions = params.additional_instructions;
    }

    if (params.image_urls?.length) {
      body.image_urls = params.image_urls;
    }

    const presentationOptions: Record<string, unknown> = {};
    if (params.title) presentationOptions.title = params.title;
    if (params.theme_id) presentationOptions.theme_id = params.theme_id;
    if (params.slide_range) presentationOptions.slide_range = params.slide_range;
    if (params.choices_per_slide) presentationOptions.choices_per_slide = params.choices_per_slide;
    if (params.export_as) presentationOptions.export_as = params.export_as;
    if (Object.keys(presentationOptions).length > 0) {
      body.presentation_options = presentationOptions;
    }

    const textOptions: Record<string, unknown> = {};
    if (params.language) textOptions.language = params.language;
    if (params.tone) textOptions.tone = params.tone;
    if (params.tone_instructions) textOptions.tone_instructions = params.tone_instructions;
    if (params.content_mode) textOptions.content_mode = params.content_mode;
    if (params.content_instructions) textOptions.content_instructions = params.content_instructions;
    if (params.amount_mode) textOptions.amount_mode = params.amount_mode;
    if (params.amount_instructions) textOptions.amount_instructions = params.amount_instructions;
    if (Object.keys(textOptions).length > 0) {
      body.text_options = textOptions;
    }

    const imageOptions: Record<string, unknown> = {};
    if (params.include_ai_images !== undefined) {
      imageOptions.include_ai_images = params.include_ai_images ? "true" : "false";
    }
    if (params.style) imageOptions.style = params.style;
    if (params.style_instructions) imageOptions.style_instructions = params.style_instructions;
    if (Object.keys(imageOptions).length > 0) {
      body.image_options = imageOptions;
    }

    return body;
  }
}
