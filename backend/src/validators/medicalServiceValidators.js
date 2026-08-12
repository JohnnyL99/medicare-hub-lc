import { body, param } from 'express-validator';
import { paginationAndSortingValidators } from './commonValidators.js';

const medicalServiceSortingFields = [
  'name',
  'createdAt',
  'updatedAt',
  'isActive',
  'durationMinutes',
  'currentPrice'
];

export const medicalServiceListValidator = paginationAndSortingValidators(
  medicalServiceSortingFields
);

export const medicalServiceIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const medicalServiceCreateValidator = [
  body('specialtyId')
    .exists()
    .withMessage('specialtyId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('specialtyId must be a positive integer')
    .toInt(),
  body('name')
    .exists({ values: 'falsy' })
    .withMessage('name is required')
    .bail()
    .isString()
    .withMessage('name must be a string')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('name must be between 2 and 150 characters'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('description must be a string')
    .trim(),
  body('durationMinutes')
    .exists()
    .withMessage('durationMinutes is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be a positive integer')
    .toInt(),
  body('currentPrice')
    .exists()
    .withMessage('currentPrice is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('currentPrice must be greater or equal to 0')
    .toFloat(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const medicalServiceUpdateValidator = [
  ...medicalServiceIdValidator,
  ...medicalServiceCreateValidator
];

export const medicalServiceStatusValidator = [
  ...medicalServiceIdValidator,
  body('isActive')
    .exists()
    .withMessage('isActive is required')
    .bail()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];
