import { sendPaginated, sendSuccess } from '../utils/response.js';
import { userService } from '../services/UserService.js';

export class UserController {
  static async list(req, res) {
    const result = await userService.list(req.query);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const user = await userService.getById(Number(req.params.id));

    return sendSuccess(res, user);
  }

  static async create(req, res) {
    const user = await userService.create(req.body);

    return sendSuccess(res, user, 201);
  }

  static async update(req, res) {
    const user = await userService.update(Number(req.params.id), req.body);

    return sendSuccess(res, user);
  }

  static async updateStatus(req, res) {
    const user = await userService.updateStatus(Number(req.params.id), req.body.isActive);

    return sendSuccess(res, user);
  }

  static async updatePassword(req, res) {
    const result = await userService.updatePassword(Number(req.params.id), req.body.password);

    return sendSuccess(res, result);
  }
}
