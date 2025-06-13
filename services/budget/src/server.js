// src/server.js
require('dotenv').config();
const app = require('./app');
const { testConnection, runMigration } = require('./config/database');

const PORT = process.env.PORT 

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

    // Start server
    app.listen(PORT, () => {
      console.log(`Budget Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
});

startServer();



