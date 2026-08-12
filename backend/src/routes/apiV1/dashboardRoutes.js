import { Router } from 'express';
import { DashboardController } from '../../controllers/DashboardController.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  dashboardCommonValidator,
  dashboardTrendValidator,
  dashboardUpcomingValidator
} from '../../validators/dashboardValidators.js';

const dashboardRouter = Router();

dashboardRouter.get(
  '/summary',
  authenticate,
  dashboardCommonValidator,
  validateRequest,
  asyncHandler(DashboardController.getSummary)
);

dashboardRouter.get(
  '/appointments-trend',
  authenticate,
  dashboardTrendValidator,
  validateRequest,
  asyncHandler(DashboardController.getAppointmentsTrend)
);

dashboardRouter.get(
  '/by-specialty',
  authenticate,
  dashboardCommonValidator,
  validateRequest,
  asyncHandler(DashboardController.getBySpecialty)
);

dashboardRouter.get(
  '/upcoming',
  authenticate,
  dashboardUpcomingValidator,
  validateRequest,
  asyncHandler(DashboardController.getUpcoming)
);

export { dashboardRouter };
