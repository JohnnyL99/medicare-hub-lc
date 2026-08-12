import { body, param } from 'express-validator';
import { paginationAndSortingValidators } from './commonValidators.js';

const specialtySortingFields = ['name', 'createdAt', 'updatedAt', 'isActive'];

export const specialtyListValidator = paginationAndSortingValidators(specialtySortingFields);

export const specialtyIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const specialtyCreateValidator = [
  body('name')
    .exists({ values: 'falsy' })
    .withMessage('name is required')
    .bail()
    .isString()
    .withMessage('name must be a string')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('name must be between 2 and 120 characters'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('description must be a string')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const specialtyUpdateValidator = [...specialtyIdValidator, ...specialtyCreateValidator];

export const specialtyStatusValidator = [
  ...specialtyIdValidator,
  body('isActive')
    .exists()
    .withMessage('isActive is required')
    .bail()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];
