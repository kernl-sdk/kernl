import type { Codec } from "@kernl-sdk/shared/lib";

import type { LimitInput } from "./query";
import type { SQLClause } from "./select";

/**
 * Codec for building sql LIMIT clause.
 */
export const SQL_LIMIT: Codec<LimitInput, SQLClause> = {
  encode({ topK, offset, startIdx }) {
    const parts: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    parts.push(`LIMIT $${idx++}`);
    params.push(topK);

    if (offset > 0) {
      parts.push(`OFFSET $${idx++}`);
      params.push(offset);
    }

    return { sql: parts.join(" "), params };
  },

  decode() {
    throw new Error("SQL_LIMIT.decode not implemented");
  },
};
