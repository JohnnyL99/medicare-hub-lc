import { body } from 'express-validator';

export const loginValidator = [
  body('email')
    .exists({ values: 'falsy' })
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('password')
    .exists({ values: 'falsy' })
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];
