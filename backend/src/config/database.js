import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { initModels } from '../models/index.js';
import { DatabaseConnectionError } from '../errors/AppError.js';

const databaseState = {
  isConnected: false,
  initializedAt: null,
  lastError: null
};

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: env.db.timezone,
  dialectOptions: {
    connectTimeout: 5000
  },
  define: {
    underscored: true,
    freezeTableName: true
  },
  logging: false
});

export const models = initModels(sequelize);

export function getDatabaseConfig() {
  return {
    host: env.db.host,
    port: env.db.port,
    name: env.db.name,
    user: env.db.user,
    timezone: env.db.timezone
  };
}

export async function authenticateDatabase() {
  try {
    await sequelize.authenticate();
    databaseState.isConnected = true;
    databaseState.initializedAt = new Date().toISOString();
    databaseState.lastError = null;
  } catch (error) {
    databaseState.isConnected = false;
    databaseState.lastError = error.message;
    throw new DatabaseConnectionError('Unable to establish database connection.');
  }
}

export async function closeDatabaseConnection() {
  if (databaseState.isConnected) {
    await sequelize.close();
    databaseState.isConnected = false;
  }
}

export function getDatabaseState() {
  return {
    isConnected: databaseState.isConnected,
    initializedAt: databaseState.initializedAt,
    lastError: databaseState.lastError
  };
}
