import { query } from 'express-validator';

export const dashboardCommonValidator = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 datetime'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 datetime'),
  query('doctorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('doctorId must be a positive integer')
    .toInt()
];

export const dashboardTrendValidator = [
  ...dashboardCommonValidator,
  query('groupBy')
    .optional()
    .isIn(['day', 'month'])
    .withMessage('groupBy must be day or month')
];

export const dashboardUpcomingValidator = [
  ...dashboardCommonValidator,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt()
];
