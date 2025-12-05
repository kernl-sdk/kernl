import type { Context } from "hono";

import { logger } from "./logger";

type StatusCode = 400 | 401 | 403 | 404 | 409 | 500 | 501;

/**
 * Base error class that provides standardized error response format.
 * All API errors should extend this class to ensure consistent response structure.
 */
export abstract class APIError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: StatusCode;
  public metadata?: any;

  constructor(message: string, metadata?: any) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
  }

  json() {
    const json = {
      error: {
        code: this.code,
        message: this.message,
      },
    };

    if (this.metadata) {
      Object.assign(json.error, this.metadata);
    }

    return json;
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends APIError {
  readonly code: string;
  readonly statusCode = 400;

  constructor(message: string = "Invalid request data", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "validation_error";
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends APIError {
  readonly code: string;
  readonly statusCode = 404;

  constructor(message: string = "Resource not found", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "not_found";
  }
}

/**
 * Internal server errors (500)
 */
export class InternalServerError extends APIError {
  readonly code: string;
  readonly statusCode = 500;

  constructor(message: string = "Internal server error", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "internal_server_error";
  }
}

/**
 * Hono error handler
 */
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof APIError) {
    logger.error({ error: err, metadata: err.metadata }, err.message);
    return c.json(err.json(), err.statusCode);
  }

  logger.error({ err }, "unknown:error");
  return c.json(
    {
      error: {
        code: "internal_server_error",
        message: "An unexpected error occurred",
      },
    },
    500
  );
}
