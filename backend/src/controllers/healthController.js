import { sendSuccess } from '../utils/response.js';

export class HealthController {
  static getHealth(_req, res) {
    return sendSuccess(res, {
      status: 'ok',
      project: 'MediCare Hub',
      clinic: 'Centro Medico Aurora',
      timestamp: new Date().toISOString()
    });
  }
}
