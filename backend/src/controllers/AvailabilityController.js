import { sendSuccess } from '../utils/response.js';
import { availabilityService } from '../services/AvailabilityService.js';

export class AvailabilityController {
  static async listByDoctor(req, res) {
    const availabilities = await availabilityService.listByDoctor(
      Number(req.params.doctorId),
      req.auth
    );

    return sendSuccess(res, availabilities);
  }

  static async createForDoctor(req, res) {
    const availability = await availabilityService.createForDoctor(
      Number(req.params.doctorId),
      req.body,
      req.auth
    );

    return sendSuccess(res, availability, 201);
  }

  static async update(req, res) {
    const availability = await availabilityService.update(
      Number(req.params.id),
      req.body,
      req.auth
    );

    return sendSuccess(res, availability);
  }

  static async delete(req, res) {
    const result = await availabilityService.delete(Number(req.params.id), req.auth);

    return sendSuccess(res, result);
  }

  static async getAvailableSlots(req, res) {
    const slots = await availabilityService.getAvailableSlots(
      Number(req.params.doctorId),
      req.query,
      req.auth
    );

    return sendSuccess(res, slots);
  }
}
