import { NotFoundError } from '../errors/AppError.js';

export function notFoundHandler(req, _res, next) {
  return next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
