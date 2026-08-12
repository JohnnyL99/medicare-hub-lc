import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../../controllers/authController.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { loginValidator } from '../../validators/authValidators.js';

const authRouter = Router();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false
});

authRouter.post(
  '/login',
  loginRateLimit,
  loginValidator,
  validateRequest,
  asyncHandler(AuthController.login)
);

authRouter.get('/me', authenticate, asyncHandler(AuthController.getMe));

export { authRouter };
