type StatusCode = 400 | 401 | 403 | 404 | 409 | 500 | 501;

/**
 * Base error class that provides standardized error response format
 * All API errors should extend this class to ensure consistent response structure
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

  /**
   * Convert error to standardized API response format
   */
  json() {
    const json = {
      error: {
        code: this.code,
        message: this.message,
      },
    };

    // Add any metadata to the error object
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
 * Authentication errors (401)
 */
export class UnauthorizedError extends APIError {
  readonly code: string;
  readonly statusCode = 401;

  constructor(message: string = "Authentication required", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "unauthorized";
  }
}

/**
 * Permission errors (403)
 */
export class ForbiddenError extends APIError {
  readonly code: string;
  readonly statusCode = 403;

  constructor(message: string = "Forbidden", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "forbidden";
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
 * Conflict errors (409)
 */
export class ConflictError extends APIError {
  readonly code: string;
  readonly statusCode = 409;

  constructor(message: string = "Resource conflict", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "conflict";
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
 * Not implemented errors (501)
 */
export class UnimplementedError extends APIError {
  readonly code: string;
  readonly statusCode = 501;

  constructor(message: string = "Not implemented", metadata?: any) {
    super(message, metadata);
    this.code = metadata?.code ?? "not_implemented";
  }
}
