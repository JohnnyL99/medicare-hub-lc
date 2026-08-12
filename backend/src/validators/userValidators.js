import { body, param, query } from 'express-validator';
import { USER_ROLES } from '../utils/constants.js';
import { paginationAndSortingValidators } from './commonValidators.js';

const userSortingFields = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'isActive'];

export const userListValidator = [
  ...paginationAndSortingValidators(userSortingFields),
  query('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`role must be one of: ${Object.values(USER_ROLES).join(', ')}`)
];

export const userIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const userCreateValidator = [
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
  body('role')
    .exists()
    .withMessage('role is required')
    .bail()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const userUpdateValidator = [
  ...userIdValidator,
  ...userCreateValidator.filter((_, index) => index !== 3)
];

export const userStatusValidator = [
  ...userIdValidator,
  body('isActive')
    .exists()
    .withMessage('isActive is required')
    .bail()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const userPasswordValidator = [
  ...userIdValidator,
  body('password')
    .exists({ values: 'falsy' })
    .withMessage('password is required')
    .bail()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long')
];
