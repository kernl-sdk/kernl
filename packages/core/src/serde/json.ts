import { z } from "zod";

/**
 * Represents a JSON-serializable value that can be safely stringified and sent to the model.
 * Recursive type that allows nested structures.
 */
export const JSONValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JSONValue),
    z.record(z.string(), JSONValue),
  ]),
);

export type JSONValue = z.infer<typeof JSONValue>;
