import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';

async function startServer() {
  try {
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`NovaBank Server running on port ${config.port} on 0.0.0.0 in ${config.nodeEnv} mode`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`Cards manifest: http://localhost:${config.port}/api/cards`);
    });

    console.log('Connecting to database...');
    connectDB().catch(err => {
      console.error('Initial MongoDB connection error; server remains online for health checks and will retry:', err.message);
    });

    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Fatal error during server startup:', err.message);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer();
}

export { startServer };
