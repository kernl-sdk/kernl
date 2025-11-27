import type { Codec } from "@kernl-sdk/shared/lib";
import type { OrderInput } from "./query";

/**
 * pgvector distance operators by similarity metric.
 */
const DISTANCE_OPS = {
  cosine: "<=>",
  euclidean: "<->",
  dot_product: "<#>",
} as const;

/**
 * Codec for building ORDER BY clause.
 */
export const SQL_ORDER: Codec<OrderInput, { sql: string }> = {
  encode({ signals, orderBy, binding, schema, table }) {
    // explicit orderBy takes precedence
    if (orderBy) {
      const dir = (orderBy.direction ?? "desc").toUpperCase();
      const col = binding?.fields[orderBy.field]?.column ?? orderBy.field;

      // Qualify the column with table name to avoid ambiguity with score alias
      if (schema && table) {
        return { sql: `"${schema}"."${table}"."${col}" ${dir}` };
      }
      return { sql: `"${col}" ${dir}` };
    }

    // vector ordering from signals
    const vsig = signals.find((s) => {
      for (const [key, val] of Object.entries(s)) {
        if (key !== "weight" && Array.isArray(val)) return true;
      }
      return false;
    });

    if (vsig) {
      for (const [key, val] of Object.entries(vsig)) {
        if (key !== "weight" && Array.isArray(val)) {
          const col = binding?.fields[key]?.column ?? key;
          const similarity = binding?.fields[key]?.similarity ?? "cosine";
          const op = DISTANCE_OPS[similarity];
          return { sql: `"${col}" ${op} $1::vector` };
        }
      }
    }

    return { sql: "score DESC" }; // default: score descending
  },

  decode() {
    throw new Error("SQL_ORDER.decode not implemented");
  },
};
