import { app } from './app.js';
import { authenticateDatabase, closeDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.port, async () => {
  console.log(`MediCare Hub backend listening on port ${env.port}`);

  if (!env.isTest) {
    try {
      await authenticateDatabase();
      console.log('Database connection established.');
    } catch (error) {
      console.error(error.message);
    }
  }
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await closeDatabaseConnection();
    } catch {
      // Ignore shutdown close errors to complete process termination.
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

export { server };
