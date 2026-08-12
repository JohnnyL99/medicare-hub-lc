import { sendSuccess } from '../utils/response.js';
import { authService } from '../services/AuthService.js';

export class AuthController {
  static async login(req, res) {
    const result = await authService.login(req.body);

    return sendSuccess(res, result);
  }

  static async getMe(req, res) {
    const user = await authService.getCurrentUser(req.auth.sub);

    return sendSuccess(res, user);
  }

  static adminCheck(_req, res) {
    return sendSuccess(res, {
      allowed: true,
      area: 'admin'
    });
  }

  static medicalCheck(_req, res) {
    return sendSuccess(res, {
      allowed: true,
      area: 'medical'
    });
  }
}
