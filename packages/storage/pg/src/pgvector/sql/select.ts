import type { Codec } from "@kernl-sdk/shared/lib";
import type { SelectInput } from "./query";

export interface SQLClause {
  sql: string;
  params: unknown[];
}

/**
 * pgvector distance operators by similarity metric.
 */
const DISTANCE_OPS = {
  cosine: "<=>",
  euclidean: "<->",
  dot_product: "<#>",
} as const;

/**
 * Codec for building SELECT clause with score expression.
 */
export const SQL_SELECT: Codec<SelectInput, SQLClause> = {
  encode({ pkey, signals, binding, include }) {
    const parts: string[] = [`"${pkey}" as id`];
    const params: unknown[] = [];

    // find vector signal for scoring
    const vsig = signals.find((s) => {
      for (const [key, val] of Object.entries(s)) {
        if (key !== "weight" && Array.isArray(val)) return true;
      }
      return false;
    });

    if (vsig) {
      // Extract vector field and value
      let vecField: string | null = null;
      let vecValue: number[] | null = null;

      for (const [key, val] of Object.entries(vsig)) {
        if (key !== "weight" && Array.isArray(val)) {
          vecField = key;
          vecValue = val as number[];
          break;
        }
      }

      if (vecField && vecValue) {
        const col = binding?.fields[vecField]?.column ?? vecField;
        const similarity = binding?.fields[vecField]?.similarity ?? "cosine";
        const op = DISTANCE_OPS[similarity];

        params.push(JSON.stringify(vecValue));

        // score expression varies by metric
        switch (similarity) {
          case "cosine":
            parts.push(`1 - ("${col}" ${op} $1::vector) as score`);
            break;
          case "euclidean":
            parts.push(`1 / (1 + ("${col}" ${op} $1::vector)) as score`);
            break;
          case "dot_product":
            parts.push(`-("${col}" ${op} $1::vector) as score`);
            break;
        }
      }
    } else {
      parts.push("1 as score");
    }

    // Select columns based on include
    // Note: We always select a calculated "score", so skip any document field named "score"
    // to avoid ambiguity and ensure hit.score is always the similarity score.
    if (binding && include !== false) {
      const fields = Object.entries(binding.fields);
      if (Array.isArray(include)) {
        // Select only specified fields
        for (const fieldName of include) {
          if (fieldName === "score") continue; // Skip to avoid overriding calculated score
          const field = binding.fields[fieldName];
          if (field) {
            parts.push(`"${field.column}"`);
          }
        }
      } else {
        // include: true or undefined → select all (except score)
        for (const [fieldName, field] of fields) {
          if (fieldName === "score") continue; // Skip to avoid overriding calculated score
          parts.push(`"${field.column}"`);
        }
      }
    }

    return { sql: parts.join(", "), params };
  },

  decode() {
    throw new Error("SQL_SELECT.decode not implemented");
  },
};
