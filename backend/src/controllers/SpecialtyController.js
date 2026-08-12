import { sendPaginated, sendSuccess } from '../utils/response.js';
import { specialtyService } from '../services/SpecialtyService.js';

export class SpecialtyController {
  static async list(req, res) {
    const result = await specialtyService.list(req.query);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const specialty = await specialtyService.getById(Number(req.params.id));

    return sendSuccess(res, specialty);
  }

  static async create(req, res) {
    const specialty = await specialtyService.create(req.body);

    return sendSuccess(res, specialty, 201);
  }

  static async update(req, res) {
    const specialty = await specialtyService.update(Number(req.params.id), req.body);

    return sendSuccess(res, specialty);
  }

  static async updateStatus(req, res) {
    const specialty = await specialtyService.updateStatus(
      Number(req.params.id),
      req.body.isActive
    );

    return sendSuccess(res, specialty);
  }
}
