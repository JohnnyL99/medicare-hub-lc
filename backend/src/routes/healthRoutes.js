import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const healthRouter = Router();

healthRouter.get('/health', asyncHandler(HealthController.getHealth));

export { healthRouter };
