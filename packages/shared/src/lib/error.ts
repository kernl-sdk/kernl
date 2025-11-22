/**
 * Standard error types for kernl packages.
 */

/**
 * Abstract base class for all kernl errors.
 * Requires subclasses to implement JSON serialization.
 */
export abstract class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON representation.
   * Must be implemented by subclasses.
   */
  abstract toJSON(): Record<string, any>;
}

/**
 * Error thrown when a feature is not yet implemented.
 */
export class UnimplementedError extends BaseError {
  constructor(message?: string) {
    super(message ?? "Not implemented");
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
    };
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
    };
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends BaseError {
  constructor(
    message: string,
    public readonly resource?: string,
  ) {
    super(message);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      resource: this.resource,
    };
  }
}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate key).
 */
export class ConflictError extends BaseError {
  constructor(
    message: string,
    public readonly resource?: string,
  ) {
    super(message);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      resource: this.resource,
    };
  }
}
