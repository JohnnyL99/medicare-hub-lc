import { Router } from 'express';
import { AvailabilityController } from '../../controllers/AvailabilityController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  availabilityIdValidator,
  availabilityUpdateValidator
} from '../../validators/availabilityValidators.js';

const availabilityRouter = Router();

availabilityRouter.put(
  '/:id',
  authenticate,
  availabilityUpdateValidator,
  validateRequest,
  asyncHandler(AvailabilityController.update)
);

availabilityRouter.delete(
  '/:id',
  authenticate,
  availabilityIdValidator,
  validateRequest,
  asyncHandler(AvailabilityController.delete)
);

export { availabilityRouter };
