
require('dotenv').config();

// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import our new components
const redisManager = require('./config/redis');
const expenseEventSubscriber = require('./events/expenseEventSubscriber');
const authServiceClient = require('./services/authServiceClient');
const expenseServiceClient = require('./services/expenseServiceClient');
const { successResponse, errorResponse } = require('./utils/response');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint with service dependencies
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    service: 'budget-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      redis: redisManager.isConnected,
      authService: 'unknown',
      expenseService: 'unknown'
    }
  };

  // Check dependency health
  try {
    const authHealth = await authServiceClient.healthCheck();
    healthStatus.dependencies.authService = authHealth.success ? 'healthy' : 'unhealthy';
  } catch (error) {
    healthStatus.dependencies.authService = 'unhealthy';
  }

  try {
    const expenseHealth = await expenseServiceClient.healthCheck();
    healthStatus.dependencies.expenseService = expenseHealth.success ? 'healthy' : 'unhealthy';
  } catch (error) {
    healthStatus.dependencies.expenseService = 'unhealthy';
  }

  // Determine overall health
  const allHealthy = healthStatus.dependencies.redis && 
                    healthStatus.dependencies.authService === 'healthy' &&
                    healthStatus.dependencies.expenseService === 'healthy';

  res.status(allHealthy ? 200 : 503).json(healthStatus);
});

// Protected API routes (require authentication)
app.use('/api/budgets', authenticateToken, (req, res) => {
  res.json(successResponse('Budget endpoints with authentication coming soon!', {
    user: req.user
  }));
});

// Service health endpoint for internal checks
app.get('/api/health/dependencies', async (req, res) => {
  try {
    const [authHealth, expenseHealth] = await Promise.all([
      authServiceClient.healthCheck(),
      expenseServiceClient.healthCheck()
    ]);

    res.json(successResponse('Dependency health check completed', {
      redis: { status: redisManager.isConnected ? 'connected' : 'disconnected' },
      authService: authHealth,
      expenseService: expenseHealth
    }));
  } catch (error) {
    res.status(500).json(errorResponse('Health check failed', {
      error: error.message
    }));
  }
});

// Initialize Redis and event subscribers
async function initializeServices() {
  try {
    console.log('Initializing budget service components...');
    
    // Connect to Redis
    await redisManager.connect();
    console.log('Redis connection established');

    // Start event subscribers
    await expenseEventSubscriber.startListening();
    console.log('Event subscribers started');

    console.log('Budget service initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize budget service:', error);
    // Don't exit the process, allow the service to run with limited functionality
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Stop event subscribers
    await expenseEventSubscriber.stopListening();
    console.log('Event subscribers stopped');

    // Disconnect from Redis
    await redisManager.disconnect();
    console.log('Redis connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize services when app starts
if (require.main === module) {
  initializeServices();
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(errorResponse(
    `Route ${req.originalUrl} not found`,
    null,
    { service: 'budget-service' }
  ));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json(errorResponse(
    message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    { status }
  ));
});

module.exports = app;