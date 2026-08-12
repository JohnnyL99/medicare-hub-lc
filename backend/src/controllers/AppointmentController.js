import { sendPaginated, sendSuccess } from '../utils/response.js';
import { appointmentService } from '../services/AppointmentService.js';

export class AppointmentController {
  static async list(req, res) {
    const result = await appointmentService.list(req.query, req.auth);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const appointment = await appointmentService.getById(Number(req.params.id), req.auth);

    return sendSuccess(res, appointment);
  }

  static async create(req, res) {
    const appointment = await appointmentService.create(req.body, req.auth);

    return sendSuccess(res, appointment, 201);
  }

  static async update(req, res) {
    const appointment = await appointmentService.update(Number(req.params.id), req.body, req.auth);

    return sendSuccess(res, appointment);
  }

  static async updateStatus(req, res) {
    const appointment = await appointmentService.updateStatus(
      Number(req.params.id),
      req.body.status,
      req.auth
    );

    return sendSuccess(res, appointment);
  }

  static async remove(req, res) {
    const appointment = await appointmentService.cancel(Number(req.params.id), req.auth);

    return sendSuccess(res, appointment);
  }
}
