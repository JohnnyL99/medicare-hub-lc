import { body, param, query } from 'express-validator';
import { paginationAndSortingValidators } from './commonValidators.js';

const doctorSortingFields = [
  'createdAt',
  'updatedAt',
  'isActive',
  'licenseNumber',
  'specialtyId',
  'lastName'
];

export const doctorListValidator = [
  ...paginationAndSortingValidators(doctorSortingFields),
  query('specialtyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('specialtyId must be a positive integer')
    .toInt()
];

export const doctorIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const doctorCreateValidator = [
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
  body('email')
    .exists({ values: 'falsy' })
    .withMessage('email is required')
    .bail()
    .isEmail()
    .withMessage('email must be valid')
    .normalizeEmail(),
  body('password')
    .exists({ values: 'falsy' })
    .withMessage('password is required')
    .bail()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long'),
  body('specialtyId')
    .exists()
    .withMessage('specialtyId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('specialtyId must be a positive integer')
    .toInt(),
  body('licenseNumber')
    .exists({ values: 'falsy' })
    .withMessage('licenseNumber is required')
    .bail()
    .isString()
    .withMessage('licenseNumber must be a string')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('licenseNumber must be between 3 and 50 characters'),
  body('biography')
    .optional({ nullable: true })
    .isString()
    .withMessage('biography must be a string')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean(),
  body('medicalServiceIds')
    .optional()
    .isArray()
    .withMessage('medicalServiceIds must be an array'),
  body('medicalServiceIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('medicalServiceIds entries must be positive integers')
    .toInt()
];

export const doctorUpdateValidator = [
  ...doctorIdValidator,
  ...doctorCreateValidator.filter((_, index) => index !== 3)
];

export const doctorStatusValidator = [
  ...doctorIdValidator,
  body('isActive')
    .exists()
    .withMessage('isActive is required')
    .bail()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const doctorServicesValidator = [
  ...doctorIdValidator,
  body('medicalServiceIds')
    .exists()
    .withMessage('medicalServiceIds is required')
    .bail()
    .isArray()
    .withMessage('medicalServiceIds must be an array'),
  body('medicalServiceIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('medicalServiceIds entries must be positive integers')
    .toInt()
];

export const doctorServicesBodyValidator = [
  body('medicalServiceIds')
    .exists()
    .withMessage('medicalServiceIds is required')
    .bail()
    .isArray()
    .withMessage('medicalServiceIds must be an array'),
  body('medicalServiceIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('medicalServiceIds entries must be positive integers')
    .toInt()
];
