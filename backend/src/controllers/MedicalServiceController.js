import { sendPaginated, sendSuccess } from '../utils/response.js';
import { medicalServiceService } from '../services/MedicalServiceService.js';

export class MedicalServiceController {
  static async list(req, res) {
    const result = await medicalServiceService.list(req.query, req.auth);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const medicalService = await medicalServiceService.getById(
      Number(req.params.id),
      req.auth
    );

    return sendSuccess(res, medicalService);
  }

  static async create(req, res) {
    const medicalService = await medicalServiceService.create(req.body);

    return sendSuccess(res, medicalService, 201);
  }

  static async update(req, res) {
    const medicalService = await medicalServiceService.update(
      Number(req.params.id),
      req.body
    );

    return sendSuccess(res, medicalService);
  }

  static async updateStatus(req, res) {
    const medicalService = await medicalServiceService.updateStatus(
      Number(req.params.id),
      req.body.isActive
    );

    return sendSuccess(res, medicalService);
  }
}
