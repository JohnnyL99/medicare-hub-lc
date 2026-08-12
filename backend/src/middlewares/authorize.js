import { ForbiddenError } from '../errors/AppError.js';

export function authorize(...roles) {
  return function roleAuthorizer(req, _res, next) {
    if (!req.auth?.role) {
      return next(new ForbiddenError('Ruolo non autorizzato'));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new ForbiddenError('Ruolo non autorizzato'));
    }

    return next();
  };
}
