import { validationResult } from 'express-validator';
import { ValidationError } from '../errors/AppError.js';

export function validateRequest(req, _res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((error) => ({
    field: error.type === 'field' ? error.path : undefined,
    message: error.msg,
    value: error.value
  }));

  return next(new ValidationError('I dati inviati non sono validi', details));
}
