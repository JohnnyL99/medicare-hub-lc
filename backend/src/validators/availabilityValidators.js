import { body, param, query } from 'express-validator';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const doctorAvailabilityListValidator = [
  param('doctorId')
    .isInt({ min: 1 })
    .withMessage('doctorId must be a positive integer')
    .toInt()
];

export const availabilityCreateValidator = [
  ...doctorAvailabilityListValidator,
  body('weekday')
    .exists()
    .withMessage('weekday is required')
    .bail()
    .isInt({ min: 1, max: 7 })
    .withMessage('weekday must be between 1 and 7')
    .toInt(),
  body('startTime')
    .exists({ values: 'falsy' })
    .withMessage('startTime is required')
    .bail()
    .matches(timeRegex)
    .withMessage('startTime must be in HH:mm or HH:mm:ss format'),
  body('endTime')
    .exists({ values: 'falsy' })
    .withMessage('endTime is required')
    .bail()
    .matches(timeRegex)
    .withMessage('endTime must be in HH:mm or HH:mm:ss format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const availabilityIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const availabilityUpdateValidator = [
  ...availabilityIdValidator,
  body('weekday')
    .exists()
    .withMessage('weekday is required')
    .bail()
    .isInt({ min: 1, max: 7 })
    .withMessage('weekday must be between 1 and 7')
    .toInt(),
  body('startTime')
    .exists({ values: 'falsy' })
    .withMessage('startTime is required')
    .bail()
    .matches(timeRegex)
    .withMessage('startTime must be in HH:mm or HH:mm:ss format'),
  body('endTime')
    .exists({ values: 'falsy' })
    .withMessage('endTime is required')
    .bail()
    .matches(timeRegex)
    .withMessage('endTime must be in HH:mm or HH:mm:ss format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean()
];

export const availableSlotsValidator = [
  ...doctorAvailabilityListValidator,
  query('date')
    .exists({ values: 'falsy' })
    .withMessage('date is required')
    .bail()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('date must be in YYYY-MM-DD format'),
  query('medicalServiceId')
    .exists({ values: 'falsy' })
    .withMessage('medicalServiceId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('medicalServiceId must be a positive integer')
    .toInt()
];
