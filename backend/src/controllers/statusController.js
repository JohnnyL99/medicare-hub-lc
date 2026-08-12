import { getDatabaseState } from '../config/database.js';
import { env } from '../config/env.js';
import { sendPaginated, sendSuccess } from '../utils/response.js';

export class StatusController {
  static getStatus(_req, res) {
    return sendSuccess(res, {
      status: 'ok',
      apiVersion: 'v1',
      environment: env.nodeEnv,
      database: getDatabaseState(),
      timestamp: new Date().toISOString()
    });
  }

  static getChecks(_req, res) {
    const dbState = getDatabaseState();

    const checks = [
      {
        name: 'http',
        status: 'ok',
        message: 'API process is running.'
      },
      {
        name: 'database',
        status: dbState.isConnected ? 'ok' : 'degraded',
        message: dbState.lastError || 'Database connection available.'
      }
    ];

    return sendPaginated(res, checks, {
      page: 1,
      pageSize: checks.length,
      totalItems: checks.length
    });
  }
}
