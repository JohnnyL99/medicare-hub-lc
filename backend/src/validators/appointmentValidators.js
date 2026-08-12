import { body, param, query } from 'express-validator';
import { APPOINTMENT_STATUSES } from '../utils/constants.js';

const appointmentSortFields = [
  'scheduledAt',
  'createdAt',
  'updatedAt',
  'status',
  'patientLastName',
  'doctorLastName',
  'medicalServiceName'
];

const isoDateTimeMessage = 'scheduledAt must be a valid ISO 8601 datetime';

export const appointmentListValidator = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO 8601 datetime'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO 8601 datetime'),
  query('doctorId').optional().isInt({ min: 1 }).withMessage('doctorId must be a positive integer').toInt(),
  query('patientId').optional().isInt({ min: 1 }).withMessage('patientId must be a positive integer').toInt(),
  query('medicalServiceId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('medicalServiceId must be a positive integer')
    .toInt(),
  query('specialtyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('specialtyId must be a positive integer')
    .toInt(),
  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUSES))
    .withMessage(`status must be one of: ${Object.values(APPOINTMENT_STATUSES).join(', ')}`),
  query('search').optional().isString().withMessage('search must be a string').trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('pageSize must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(appointmentSortFields)
    .withMessage(`sortBy must be one of: ${appointmentSortFields.join(', ')}`),
  query('sortDirection').optional().isIn(['asc', 'desc']).withMessage('sortDirection must be asc or desc')
];

export const appointmentIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt()
];

export const appointmentCreateValidator = [
  body('patientId')
    .exists()
    .withMessage('patientId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('patientId must be a positive integer')
    .toInt(),
  body('doctorId')
    .exists()
    .withMessage('doctorId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('doctorId must be a positive integer')
    .toInt(),
  body('medicalServiceId')
    .exists()
    .withMessage('medicalServiceId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('medicalServiceId must be a positive integer')
    .toInt(),
  body('scheduledAt')
    .exists({ values: 'falsy' })
    .withMessage('scheduledAt is required')
    .bail()
    .isISO8601()
    .withMessage(isoDateTimeMessage),
  body('operationalNotes')
    .optional({ nullable: true })
    .isString()
    .withMessage('operationalNotes must be a string')
    .trim()
];

export const appointmentUpdateValidator = [...appointmentIdValidator, ...appointmentCreateValidator];

export const appointmentStatusValidator = [
  ...appointmentIdValidator,
  body('status')
    .exists({ values: 'falsy' })
    .withMessage('status is required')
    .bail()
    .isIn(Object.values(APPOINTMENT_STATUSES))
    .withMessage(`status must be one of: ${Object.values(APPOINTMENT_STATUSES).join(', ')}`)
];

export const appointmentDoctorUpdateValidator = [
  ...appointmentIdValidator,
  body('operationalNotes')
    .optional({ nullable: true })
    .isString()
    .withMessage('operationalNotes must be a string')
    .trim(),
  body().custom((value) => {
    const allowedKeys = ['operationalNotes'];
    const keys = Object.keys(value || {});

    if (keys.some((key) => !allowedKeys.includes(key))) {
      throw new Error('DOCTOR can update only operationalNotes');
    }

    return true;
  })
];
