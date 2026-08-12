import { Router } from 'express';
import { AppointmentController } from '../../controllers/AppointmentController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  appointmentCreateValidator,
  appointmentDoctorUpdateValidator,
  appointmentIdValidator,
  appointmentListValidator,
  appointmentStatusValidator,
  appointmentUpdateValidator
} from '../../validators/appointmentValidators.js';

const appointmentRouter = Router();

appointmentRouter.get(
  '/',
  authenticate,
  appointmentListValidator,
  validateRequest,
  asyncHandler(AppointmentController.list)
);

appointmentRouter.get(
  '/:id',
  authenticate,
  appointmentIdValidator,
  validateRequest,
  asyncHandler(AppointmentController.getById)
);

appointmentRouter.post(
  '/',
  authenticate,
  appointmentCreateValidator,
  validateRequest,
  asyncHandler(AppointmentController.create)
);

appointmentRouter.put(
  '/:id',
  authenticate,
  (req, _res, next) => {
    req.appointmentUpdateValidator =
      req.auth?.role === 'DOCTOR' ? appointmentDoctorUpdateValidator : appointmentUpdateValidator;
    next();
  },
  (req, _res, next) => {
    Promise.all(req.appointmentUpdateValidator.map((validator) => validator.run(req)))
      .then(() => next())
      .catch(next);
  },
  validateRequest,
  asyncHandler(AppointmentController.update)
);

appointmentRouter.patch(
  '/:id/status',
  authenticate,
  appointmentStatusValidator,
  validateRequest,
  asyncHandler(AppointmentController.updateStatus)
);

appointmentRouter.delete(
  '/:id',
  authenticate,
  appointmentIdValidator,
  validateRequest,
  asyncHandler(AppointmentController.remove)
);

export { appointmentRouter };
