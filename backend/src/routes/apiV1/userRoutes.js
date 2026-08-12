import { Router } from 'express';
import { UserController } from '../../controllers/UserController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { USER_ROLES } from '../../utils/constants.js';
import {
  userCreateValidator,
  userIdValidator,
  userListValidator,
  userPasswordValidator,
  userStatusValidator,
  userUpdateValidator
} from '../../validators/userValidators.js';

const userRouter = Router();

userRouter.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userListValidator,
  validateRequest,
  asyncHandler(UserController.list)
);

userRouter.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userIdValidator,
  validateRequest,
  asyncHandler(UserController.getById)
);

userRouter.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userCreateValidator,
  validateRequest,
  asyncHandler(UserController.create)
);

userRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userUpdateValidator,
  validateRequest,
  asyncHandler(UserController.update)
);

userRouter.patch(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userStatusValidator,
  validateRequest,
  asyncHandler(UserController.updateStatus)
);

userRouter.patch(
  '/:id/password',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userPasswordValidator,
  validateRequest,
  asyncHandler(UserController.updatePassword)
);

export { userRouter };
