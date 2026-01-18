type StatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export abstract class APIError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: StatusCode;
  public metadata?: unknown;

  constructor(message: string, metadata?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
  }

  json() {
    const json: Record<string, unknown> = {
      error: {
        code: this.code,
        message: this.message,
      },
    };

    if (this.metadata) {
      Object.assign(json.error as object, this.metadata);
    }

    return json;
  }
}

export class ValidationError extends APIError {
  readonly code = "validation_error";
  readonly statusCode = 400;
}

export class NotFoundError extends APIError {
  readonly code = "not_found";
  readonly statusCode = 404;
}

export class InternalServerError extends APIError {
  readonly code = "internal_server_error";
  readonly statusCode = 500;
}
