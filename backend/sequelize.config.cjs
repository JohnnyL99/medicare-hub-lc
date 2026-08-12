require('dotenv').config();

const common = {
  dialect: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'medicare_hub',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  timezone: process.env.DB_TIMEZONE || '+00:00',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_meta'
};

module.exports = {
  development: common,
  test: {
    ...common,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME || 'medicare_hub_test'
  },
  production: common
};
