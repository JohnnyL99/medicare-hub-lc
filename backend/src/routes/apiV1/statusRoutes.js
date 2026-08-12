import { Router } from 'express';
import { StatusController } from '../../controllers/statusController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const statusRouter = Router();

statusRouter.get('/', asyncHandler(StatusController.getStatus));
statusRouter.get('/checks', asyncHandler(StatusController.getChecks));

export { statusRouter };
