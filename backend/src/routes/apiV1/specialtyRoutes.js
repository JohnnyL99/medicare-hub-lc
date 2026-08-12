import { Router } from 'express';
import { SpecialtyController } from '../../controllers/SpecialtyController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { USER_ROLES } from '../../utils/constants.js';
import {
  specialtyCreateValidator,
  specialtyIdValidator,
  specialtyListValidator,
  specialtyStatusValidator,
  specialtyUpdateValidator
} from '../../validators/specialtyValidators.js';

const specialtyRouter = Router();

specialtyRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST),
  specialtyListValidator,
  validateRequest,
  asyncHandler(SpecialtyController.list)
);

specialtyRouter.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST),
  specialtyIdValidator,
  validateRequest,
  asyncHandler(SpecialtyController.getById)
);

specialtyRouter.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  specialtyCreateValidator,
  validateRequest,
  asyncHandler(SpecialtyController.create)
);

specialtyRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  specialtyUpdateValidator,
  validateRequest,
  asyncHandler(SpecialtyController.update)
);

specialtyRouter.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  specialtyStatusValidator,
  validateRequest,
  asyncHandler(SpecialtyController.updateStatus)
);

export { specialtyRouter };
