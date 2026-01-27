import type { Context } from "@/context";
import type { LanguageModelItem } from "@kernl-sdk/protocol";
import { GuardrailError } from "@/error";

/**
 * A pipe operation transforms items.
 */
export type PipeOp = (
  ctx: Context,
  items: LanguageModelItem[],
) => Promise<LanguageModelItem[]> | LanguageModelItem[];

/**
 * Guardrail function - throw to block.
 */
export type GuardrailFn = (
  ctx: Context,
  items: LanguageModelItem[],
) => Promise<void> | void;

/**
 * Redaction categories.
 */
export type RedactTerm = "PII" | "SECRETS" | (string & {});

/**
 * Composable, lazy pipeline for processing language model items.
 *
 * @example
 * ```ts
 * const pre = pipe
 *   .filter(item => item.kind !== "delta")
 *   .redact(['PII', 'SECRETS'])
 *   .truncate(4000)
 *   .guardrail();
 *
 * const processed = await pre.run(items, ctx);
 * ```
 */
export class Pipe {
  private ops: PipeOp[];

  constructor(ops: PipeOp[] = []) {
    this.ops = ops;
  }

  /**
   * Execute the pipeline.
   */
  async run(
    ctx: Context,
    items: LanguageModelItem[],
  ): Promise<LanguageModelItem[]> {
    let result = items;
    for (const op of this.ops) {
      result = await op(ctx, result);
    }
    return result;
  }

  /**
   * Filter items based on predicate.
   */
  filter(fn: (item: LanguageModelItem) => boolean): Pipe {
    return new Pipe([...this.ops, (_ctx, items) => items.filter(fn)]);
  }

  /**
   * Transform items. Escape hatch for custom operations.
   */
  map(fn: (item: LanguageModelItem) => LanguageModelItem): Pipe {
    return new Pipe([...this.ops, (_ctx, items) => items.map(fn)]);
  }

  /**
   * Run guardrail check. Throw to block the request.
   */
  guardrail(fn?: GuardrailFn): Pipe {
    return new Pipe([
      ...this.ops,
      async (ctx, items) => {
        if (fn) await fn(ctx, items);
        return items;
      },
    ]);
  }

  // /**
  //  * Truncate to max tokens/characters.
  //  *
  //  * TODO: implement actual truncation logic
  //  */
  // truncate(max: number): Pipe {
  //   return new Pipe([
  //     ...this.ops,
  //     (_ctx, items) => {
  //       // placeholder - implement truncation strategy
  //       // could be token-based, char-based, or message-based
  //       return items;
  //     },
  //   ]);
  // }

  // /**
  //  * Redact sensitive content by category.
  //  *
  //  * TODO: implement actual redaction logic
  //  */
  // redact(categories: RedactTerm[]): Pipe {
  //   return new Pipe([
  //     ...this.ops,
  //     (_ctx, items) => {
  //       // placeholder - implement redaction
  //       // could use regex patterns, ML models, etc.
  //       return items;
  //     },
  //   ]);
  // }
}

/**
 * Entry point for creating pipelines.
 */
export const pipe = new Pipe();
