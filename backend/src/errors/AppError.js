export class AppError extends Error {
  constructor({
    code = 'INTERNAL_ERROR',
    message = 'Unexpected error',
    statusCode = 500,
    details = [],
    expose = false
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.expose = expose;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'I dati inviati non sono validi', details = []) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 422,
      details,
      expose: true
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Risorsa non trovata') {
    super({
      code: 'NOT_FOUND',
      message,
      statusCode: 404,
      expose: true
    });
  }
}

export class NotImplementedError extends AppError {
  constructor(message = 'Funzionalita non ancora implementata') {
    super({
      code: 'NOT_IMPLEMENTED',
      message,
      statusCode: 501,
      expose: true
    });
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = 'Database connection failed') {
    super({
      code: 'DATABASE_CONNECTION_ERROR',
      message,
      statusCode: 503,
      expose: true
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Credenziali o token non validi') {
    super({
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401,
      expose: true
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Ruolo non autorizzato') {
    super({
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
      expose: true
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Risorsa in conflitto') {
    super({
      code: 'CONFLICT',
      message,
      statusCode: 409,
      expose: true
    });
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Richiesta non valida') {
    super({
      code: 'BAD_REQUEST',
      message,
      statusCode: 400,
      expose: true
    });
  }
}
