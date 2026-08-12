import { UnauthorizedError } from '../errors/AppError.js';
import { authService } from '../services/AuthService.js';

export function authenticate(req, _res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token non valido'));
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    return next(new UnauthorizedError('Token non valido'));
  }

  const payload = authService.verifyAccessToken(token);

  req.auth = {
    sub: payload.sub,
    role: payload.role,
    iat: payload.iat,
    exp: payload.exp
  };

  return next();
}
