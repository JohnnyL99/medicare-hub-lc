import { sendSuccess } from '../utils/response.js';
import { dashboardService } from '../services/DashboardService.js';

export class DashboardController {
  static async getSummary(req, res) {
    const data = await dashboardService.getSummary(req.query, req.auth);

    return sendSuccess(res, data);
  }

  static async getAppointmentsTrend(req, res) {
    const data = await dashboardService.getAppointmentsTrend(req.query, req.auth);

    return sendSuccess(res, data);
  }

  static async getBySpecialty(req, res) {
    const data = await dashboardService.getBySpecialty(req.query, req.auth);

    return sendSuccess(res, data);
  }

  static async getUpcoming(req, res) {
    const data = await dashboardService.getUpcoming(req.query, req.auth);

    return sendSuccess(res, {
      timezone: dashboardService.getTimezone(),
      items: data
    });
  }
}
