/**
 * SQL utilities for safe query construction.
 */

/**
 * SQL identifier regex - alphanumeric + underscore, must start with letter/underscore.
 */
export const SQL_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
