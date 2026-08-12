import morgan from 'morgan';
import { env } from '../config/env.js';

export const requestLogger = morgan(
  env.isProduction ? 'combined' : 'dev',
  env.isTest
    ? {
        skip: () => true
      }
    : undefined
);
