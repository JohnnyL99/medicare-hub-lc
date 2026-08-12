import { Router } from 'express';
import { AuthController } from '../../controllers/authController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { USER_ROLES } from '../../utils/constants.js';

const accessRouter = Router();

accessRouter.get(
  '/admin/check',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(AuthController.adminCheck)
);

accessRouter.get(
  '/medical/check',
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  asyncHandler(AuthController.medicalCheck)
);

export { accessRouter };
