// src/server.js
require('dotenv').config();
const app = require('./app');
const { testConnection, runMigration, closePool } = require('./config/database');
const redisManager = require('./config/redis');
const expenseEventSubscriber = require('./events/expenseEventSubscriber');

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Run migrations
    await runMigration();

    // Connect to Redis
    await redisManager.connect();
    console.log('Redis connected successfully');

    // Initialize event subscribers
    await expenseEventSubscriber.initialize();
    console.log('Event subscribers initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`Budget Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Redis Host: ${process.env.REDIS_HOST}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal. Graceful shutdown...');
  
  try {
    // Close Redis connections
    await redisManager.disconnect();
    console.log('Redis disconnected');
    
    // Close database pool
    await closePool();
    console.log('Database pool closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();