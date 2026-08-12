import bcrypt from 'bcryptjs';
import { sendPaginated, sendSuccess } from '../utils/response.js';
import { doctorAdminService } from '../services/DoctorAdminService.js';

export class DoctorController {
  static async list(req, res) {
    const result = await doctorAdminService.list(req.query);

    return sendPaginated(res, result.data, result.meta);
  }

  static async getById(req, res) {
    const doctor = await doctorAdminService.getById(Number(req.params.id), req.auth);

    return sendSuccess(res, doctor);
  }

  static async getCurrent(req, res) {
    const doctor = await doctorAdminService.getCurrentDoctor(req.auth.sub);

    return sendSuccess(res, doctor);
  }

  static async create(req, res) {
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const doctor = await doctorAdminService.create({
      ...req.body,
      passwordHash
    });

    return sendSuccess(res, doctor, 201);
  }

  static async update(req, res) {
    const doctor = await doctorAdminService.update(Number(req.params.id), req.body);

    return sendSuccess(res, doctor);
  }

  static async updateStatus(req, res) {
    const doctor = await doctorAdminService.updateStatus(
      Number(req.params.id),
      req.body.isActive
    );

    return sendSuccess(res, doctor);
  }

  static async replaceServices(req, res) {
    const doctor = await doctorAdminService.replaceServices(
      Number(req.params.id),
      req.body.medicalServiceIds,
      req.auth
    );

    return sendSuccess(res, doctor);
  }

  static async replaceCurrentServices(req, res) {
    const currentDoctor = await doctorAdminService.getCurrentDoctor(req.auth.sub);
    const doctor = await doctorAdminService.replaceServices(
      Number(currentDoctor.id),
      req.body.medicalServiceIds,
      req.auth
    );

    return sendSuccess(res, doctor);
  }

  static async listAssignableServices(req, res) {
    const services = await doctorAdminService.listAssignableServices(req.auth.sub);

    return sendSuccess(res, services);
  }
}
