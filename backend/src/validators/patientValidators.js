import { body, param, query } from 'express-validator';
import { paginationAndSortingValidators } from './commonValidators.js';

const patientSortingFields = [
  'firstName',
  'lastName',
  'email',
  'birthDate',
  'createdAt',
  'isActive'
];
const phoneRegex = /^\+?[0-9\s-]{6,30}$/;

export const patientListValidator = [
  ...paginationAndSortingValidators(patientSortingFields),
  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string')
    .trim()
];

export const patientIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const patientCreateValidator = [
  body('firstName')
    .exists({ values: 'falsy' })
    .withMessage('firstName is required')
    .bail()
    .isString()
    .withMessage('firstName must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('firstName must be between 2 and 100 characters'),
  body('lastName')
    .exists({ values: 'falsy' })
    .withMessage('lastName is required')
    .bail()
    .isString()
    .withMessage('lastName must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('lastName must be between 2 and 100 characters'),
  body('birthDate')
    .exists({ values: 'falsy' })
    .withMessage('birthDate is required')
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('birthDate must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date > today) {
        throw new Error('birthDate cannot be in the future');
      }

      return true;
    }),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('email must be valid')
    .normalizeEmail(),
  body('phone')
    .exists({ values: 'falsy' })
    .withMessage('phone is required')
    .bail()
    .matches(phoneRegex)
    .withMessage('phone format is invalid')
    .trim(),
  body('fiscalCode')
    .optional({ nullable: true })
    .isString()
    .withMessage('fiscalCode must be a string')
    .trim()
    .isLength({ min: 6, max: 32 })
    .withMessage('fiscalCode must be between 6 and 32 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const patientUpdateValidator = [...patientIdValidator, ...patientCreateValidator];

export const patientStatusValidator = [
  ...patientIdValidator,
  body('isActive')
    .exists()
    .withMessage('isActive is required')
    .bail()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];
