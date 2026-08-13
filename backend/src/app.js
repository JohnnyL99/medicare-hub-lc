import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { ForbiddenError } from './errors/AppError.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { router } from './routes/index.js';
import { swaggerSpec } from './utils/swagger.js';

const app = express();

if (env.trustProxy !== false) {
  app.set('trust proxy', env.trustProxy);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      if (env.corsAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(
        new ForbiddenError(
          `CORS origin non consentita: ${normalizedOrigin}. Verificare CORS_ORIGIN nel backend Railway.`
        )
      );
    }
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
