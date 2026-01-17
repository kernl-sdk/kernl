/**
 * Provider utilities for parsing model identifiers
 */

export namespace Provider {
  export interface ParsedModel {
    providerID: string
    modelID: string
  }

  /**
   * Parse a model string in "provider/model" format
   */
  export function parseModel(model: string): ParsedModel {
    const slashIndex = model.indexOf("/")
    if (slashIndex === -1) {
      return { providerID: "default", modelID: model }
    }
    return {
      providerID: model.slice(0, slashIndex),
      modelID: model.slice(slashIndex + 1),
    }
  }
}
