import { Router } from 'express';
import { PatientController } from '../../controllers/PatientController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { USER_ROLES } from '../../utils/constants.js';
import {
  patientCreateValidator,
  patientIdValidator,
  patientListValidator,
  patientStatusValidator,
  patientUpdateValidator
} from '../../validators/patientValidators.js';

const patientRouter = Router();

patientRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  patientListValidator,
  validateRequest,
  asyncHandler(PatientController.list)
);

patientRouter.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  patientIdValidator,
  validateRequest,
  asyncHandler(PatientController.getById)
);

patientRouter.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  patientCreateValidator,
  validateRequest,
  asyncHandler(PatientController.create)
);

patientRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST),
  patientUpdateValidator,
  validateRequest,
  asyncHandler(PatientController.update)
);

patientRouter.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST),
  patientStatusValidator,
  validateRequest,
  asyncHandler(PatientController.updateStatus)
);

export { patientRouter };
