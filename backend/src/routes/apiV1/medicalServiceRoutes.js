import { Router } from 'express';
import { MedicalServiceController } from '../../controllers/MedicalServiceController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { USER_ROLES } from '../../utils/constants.js';
import {
  medicalServiceCreateValidator,
  medicalServiceIdValidator,
  medicalServiceListValidator,
  medicalServiceStatusValidator,
  medicalServiceUpdateValidator
} from '../../validators/medicalServiceValidators.js';

const medicalServiceRouter = Router();

medicalServiceRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  medicalServiceListValidator,
  validateRequest,
  asyncHandler(MedicalServiceController.list)
);

medicalServiceRouter.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  medicalServiceIdValidator,
  validateRequest,
  asyncHandler(MedicalServiceController.getById)
);

medicalServiceRouter.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  medicalServiceCreateValidator,
  validateRequest,
  asyncHandler(MedicalServiceController.create)
);

medicalServiceRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  medicalServiceUpdateValidator,
  validateRequest,
  asyncHandler(MedicalServiceController.update)
);

medicalServiceRouter.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  medicalServiceStatusValidator,
  validateRequest,
  asyncHandler(MedicalServiceController.updateStatus)
);

export { medicalServiceRouter };
