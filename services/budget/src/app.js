
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
const healthCheckService = require('./services/healthCheckService');
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
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'budget-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Quick health check for load balancers
app.get('/health/quick', async (req, res) => {
  const quickHealth = await healthCheckService.quickHealthCheck();
  res.json(quickHealth);
});

// Deep health check with detailed information
app.get('/health/deep', async (req, res) => {
  try {
    const deepHealth = await healthCheckService.deepHealthCheck();
    res.json(deepHealth);
  } catch (error) {
    res.status(503).json(errorResponse(
      'Deep health check failed',
      { error: error.message }
    ));
  }
});

// Import routes
const budgetRoutes = require('./routes/budgets');

// Protected API routes (require authentication)
app.use('/api/budgets', authenticateToken, budgetRoutes);

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