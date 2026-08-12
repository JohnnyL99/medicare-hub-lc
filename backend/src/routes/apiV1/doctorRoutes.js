import { Router } from 'express';
import { AvailabilityController } from '../../controllers/AvailabilityController.js';
import { DoctorController } from '../../controllers/DoctorController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { USER_ROLES } from '../../utils/constants.js';
import {
  doctorCreateValidator,
  doctorIdValidator,
  doctorListValidator,
  doctorServicesBodyValidator,
  doctorServicesValidator,
  doctorStatusValidator,
  doctorUpdateValidator
} from '../../validators/doctorValidators.js';
import {
  availabilityCreateValidator,
  availableSlotsValidator,
  doctorAvailabilityListValidator
} from '../../validators/availabilityValidators.js';

const doctorRouter = Router();

doctorRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST),
  doctorListValidator,
  validateRequest,
  asyncHandler(DoctorController.list)
);

doctorRouter.get(
  '/me',
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  asyncHandler(DoctorController.getCurrent)
);

doctorRouter.get(
  '/me/available-services',
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  asyncHandler(DoctorController.listAssignableServices)
);

doctorRouter.get(
  '/:doctorId/availabilities',
  authenticate,
  doctorAvailabilityListValidator,
  validateRequest,
  asyncHandler(AvailabilityController.listByDoctor)
);

doctorRouter.post(
  '/:doctorId/availabilities',
  authenticate,
  availabilityCreateValidator,
  validateRequest,
  asyncHandler(AvailabilityController.createForDoctor)
);

doctorRouter.get(
  '/:doctorId/available-slots',
  authenticate,
  availableSlotsValidator,
  validateRequest,
  asyncHandler(AvailabilityController.getAvailableSlots)
);

doctorRouter.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  doctorIdValidator,
  validateRequest,
  asyncHandler(DoctorController.getById)
);

doctorRouter.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  doctorCreateValidator,
  validateRequest,
  asyncHandler(DoctorController.create)
);

doctorRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  doctorUpdateValidator,
  validateRequest,
  asyncHandler(DoctorController.update)
);

doctorRouter.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  doctorStatusValidator,
  validateRequest,
  asyncHandler(DoctorController.updateStatus)
);

doctorRouter.put(
  '/me/services',
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  doctorServicesBodyValidator,
  validateRequest,
  asyncHandler(DoctorController.replaceCurrentServices)
);

doctorRouter.put(
  '/:id/services',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR),
  doctorServicesValidator,
  validateRequest,
  asyncHandler(DoctorController.replaceServices)
);

export { doctorRouter };
