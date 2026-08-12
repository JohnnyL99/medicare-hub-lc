import { sendPaginated, sendSuccess } from '../utils/response.js';
import { patientService } from '../services/PatientService.js';

export class PatientController {
  static async list(req, res) {
    const result = await patientService.list(req.query, req.auth);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const patient = await patientService.getById(Number(req.params.id), req.auth);

    return sendSuccess(res, patient);
  }

  static async create(req, res) {
    const patient = await patientService.create(req.body);

    return sendSuccess(res, patient, 201);
  }

  static async update(req, res) {
    const patient = await patientService.update(Number(req.params.id), req.body);

    return sendSuccess(res, patient);
  }

  static async updateStatus(req, res) {
    const patient = await patientService.updateStatus(Number(req.params.id), req.body.isActive);

    return sendSuccess(res, patient);
  }
}
