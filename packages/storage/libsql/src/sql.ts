/**
 * SQL utilities for safe query construction.
 */

/**
 * SQL identifier regex - alphanumeric + underscore, must start with letter/underscore.
 */
export const SQL_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * SQL clause with placeholder parameters.
 */
export interface SQLClause {
  sql: string;
  params: unknown[];
}

/**
 * Expand an array into individual ? placeholders for IN clause.
 *
 * LibSQL/SQLite doesn't support array parameters like PostgreSQL's ANY($1).
 * This helper expands arrays into individual placeholders.
 *
 * @example
 * expandArray(['a', 'b', 'c']) => { placeholders: '?, ?, ?', params: ['a', 'b', 'c'] }
 */
export function expandarray(arr: unknown[]): {
  placeholders: string;
  params: unknown[];
} {
  return {
    placeholders: arr.map(() => "?").join(", "),
    params: arr,
  };
}
