import { query } from 'express-validator';

export function paginationAndSortingValidators(allowedOrderBy) {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer')
      .toInt(),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('pageSize must be between 1 and 100')
      .toInt(),
    query('name')
      .optional()
      .isString()
      .withMessage('name filter must be a string')
      .trim(),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive filter must be boolean')
      .toBoolean(),
    query('orderBy')
      .optional()
      .isIn(allowedOrderBy)
      .withMessage(`orderBy must be one of: ${allowedOrderBy.join(', ')}`),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('sortOrder must be asc or desc')
  ];
}
