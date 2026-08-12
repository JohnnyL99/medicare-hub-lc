import { Router } from 'express';
import { env } from '../config/env.js';
import { healthRouter } from './healthRoutes.js';
import { accessRouter } from './apiV1/accessRoutes.js';
import { availabilityRouter } from './apiV1/availabilityRoutes.js';
import { appointmentRouter } from './apiV1/appointmentRoutes.js';
import { authRouter } from './apiV1/authRoutes.js';
import { dashboardRouter } from './apiV1/dashboardRoutes.js';
import { doctorRouter } from './apiV1/doctorRoutes.js';
import { medicalServiceRouter } from './apiV1/medicalServiceRoutes.js';
import { patientRouter } from './apiV1/patientRoutes.js';
import { specialtyRouter } from './apiV1/specialtyRoutes.js';
import { statusRouter } from './apiV1/statusRoutes.js';
import { userRouter } from './apiV1/userRoutes.js';

const router = Router();
const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use(accessRouter);
apiV1Router.use('/users', userRouter);
apiV1Router.use('/doctors', doctorRouter);
apiV1Router.use('/availabilities', availabilityRouter);
apiV1Router.use('/appointments', appointmentRouter);
apiV1Router.use('/dashboard', dashboardRouter);
apiV1Router.use('/patients', patientRouter);
apiV1Router.use('/specialties', specialtyRouter);
apiV1Router.use('/medical-services', medicalServiceRouter);
apiV1Router.use('/status', statusRouter);

router.use(healthRouter);
router.use(env.apiBasePath, apiV1Router);

export { router };
