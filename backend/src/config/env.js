import dotenv from 'dotenv';

dotenv.config();

function normalizeOrigin(origin) {
  if (typeof origin !== 'string') {
    return '';
  }

  return origin.trim().replace(/\/+$/, '');
}

function parseCorsOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  const numericValue = Number(value);

  if (Number.isInteger(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsAllowedOrigins = parseCorsOrigins(corsOrigin);
const jwtSecret = process.env.JWT_SECRET || 'change-me';
const defaultJwtExpiresIn = `${Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 60)}m`;
const apiPublicUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;

if (isProduction) {
  if (!jwtSecret || jwtSecret === 'change-me') {
    throw new Error('JWT_SECRET must be configured with a non-default value in production');
  }

  if (!corsAllowedOrigins.length || corsAllowedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must not be wildcard or empty in production');
  }
}

export const env = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  isProduction,
  port: Number(process.env.PORT || 4000),
  apiBasePath: '/api/v1',
  corsOrigin,
  corsAllowedOrigins,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || defaultJwtExpiresIn,
  apiPublicUrl,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'medicare_hub',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    timezone: process.env.DB_TIMEZONE || '+00:00'
  },
  jwtSecret
};
