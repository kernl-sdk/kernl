/**
 * Filter conversion codecs.
 */

import type {
  FilterExpression,
  FieldFilter,
  ExistsFilter,
  FieldOp,
} from "@kernl-sdk/retrieval";
import type { Filter } from "@turbopuffer/turbopuffer/resources/custom";

/**
 * Map kernl filter operators to Turbopuffer operators.
 */
type TpufFilterOp =
  | "Eq"
  | "NotEq"
  | "In"
  | "NotIn"
  | "Contains"
  | "NotContains"
  | "ContainsAny"
  | "NotContainsAny"
  | "Lt"
  | "Lte"
  | "Gt"
  | "Gte"
  | "Glob"
  | "NotGlob";

const FILTER_OP_MAP: Record<FieldOp, TpufFilterOp> = {
  eq: "Eq",
  neq: "NotEq",
  gt: "Gt",
  gte: "Gte",
  lt: "Lt",
  lte: "Lte",
  in: "In",
  nin: "NotIn",
  contains: "Contains",
  starts_with: "Glob", // will add * suffix
  ends_with: "Glob", // will add * prefix
  contains_all: "ContainsAny", // closest match
  contains_any: "ContainsAny",
};

/**
 * Type guards for filter expressions.
 */
function isFieldFilter(f: FilterExpression): f is FieldFilter {
  return "field" in f && "op" in f && "value" in f;
}

function isExistsFilter(f: FilterExpression): f is ExistsFilter {
  return (
    "field" in f && "op" in f && (f.op === "exists" || f.op === "not_exists")
  );
}

function isAndFilter(f: FilterExpression): f is { and: FilterExpression[] } {
  return "and" in f;
}

function isOrFilter(f: FilterExpression): f is { or: FilterExpression[] } {
  return "or" in f;
}

function isNotFilter(f: FilterExpression): f is { not: FilterExpression } {
  return "not" in f;
}

/**
 * Codec for converting FilterExpression to Turbopuffer Filter.
 */
export const FILTER = {
  encode: (filter: FilterExpression): Filter => {
    if (isAndFilter(filter)) {
      return ["And", filter.and.map(FILTER.encode)];
    }

    if (isOrFilter(filter)) {
      return ["Or", filter.or.map(FILTER.encode)];
    }

    if (isNotFilter(filter)) {
      return ["Not", FILTER.encode(filter.not)];
    }

    if (isExistsFilter(filter)) {
      // exists → NotEq null, not_exists → Eq null
      return filter.op === "exists"
        ? [filter.field, "NotEq", null]
        : [filter.field, "Eq", null];
    }

    if (isFieldFilter(filter)) {
      const { field, op, value } = filter;

      // Handle glob patterns for starts_with/ends_with
      if (op === "starts_with") {
        return [field, "Glob", `${value}*`];
      }
      if (op === "ends_with") {
        return [field, "Glob", `*${value}`];
      }

      const tpufOp = FILTER_OP_MAP[op];
      return [field, tpufOp, value] as Filter;
    }

    throw new Error(`Unknown filter type: ${JSON.stringify(filter)}`);
  },

  decode: (_filter: Filter): FilterExpression => {
    throw new Error("FILTER.decode: not implemented");
  },
};
