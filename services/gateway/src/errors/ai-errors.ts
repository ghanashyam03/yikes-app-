export class GatewayError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AiUnavailableError extends GatewayError {
  constructor(message = 'AI provider unavailable for all configured models') {
    super(message, 'AI_UNAVAILABLE', 503);
  }
}

export class GatewayBusyError extends GatewayError {
  constructor(message = 'Gateway request queue timeout; system busy') {
    super(message, 'BUSY', 429);
  }
}

export class BadOutputError extends GatewayError {
  readonly rawText?: string | undefined;

  constructor(message = 'Model output did not match expected schema', rawText?: string) {
    super(message, 'BAD_OUTPUT', 502);
    this.rawText = rawText;
  }
}

export class AuthError extends GatewayError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
