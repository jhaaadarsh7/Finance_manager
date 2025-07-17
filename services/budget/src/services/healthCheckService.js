const redisManager = require('../config/redis');
const authServiceClient = require('../services/authServiceClient');
const expenseServiceClient = require('../services/expenseServiceClient');
const { successResponse, errorResponse } = require('../utils/response');

class HealthCheckService {
  /**
   * Comprehensive health check
   */
  async performHealthCheck() {
    const healthStatus = {
      status: 'healthy',
      service: 'budget-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dependencies: {},
      connectivity: {},
      memory: this.getMemoryUsage(),
      features: {
        redis_pub_sub: false,
        event_processing: false,
        service_communication: false
      }
    };

    // Check Redis connectivity
    try {
      healthStatus.dependencies.redis = {
        status: redisManager.isConnected ? 'healthy' : 'unhealthy',
        publisher: !!redisManager.publisherClient,
        subscriber: !!redisManager.subscriberClient
      };
      healthStatus.features.redis_pub_sub = redisManager.isConnected;
    } catch (error) {
      healthStatus.dependencies.redis = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check auth service
    try {
      const authHealth = await authServiceClient.healthCheck();
      healthStatus.dependencies.authService = {
        status: authHealth.success ? 'healthy' : 'unhealthy',
        response_time: authHealth.responseTime,
        last_check: new Date().toISOString()
      };
      healthStatus.connectivity.auth_service = authHealth.success;
    } catch (error) {
      healthStatus.dependencies.authService = {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString()
      };
      healthStatus.connectivity.auth_service = false;
    }

    // Check expense service
    try {
      const expenseHealth = await expenseServiceClient.healthCheck();
      healthStatus.dependencies.expenseService = {
        status: expenseHealth.success ? 'healthy' : 'unhealthy',
        response_time: expenseHealth.responseTime,
        last_check: new Date().toISOString()
      };
      healthStatus.connectivity.expense_service = expenseHealth.success;
    } catch (error) {
      healthStatus.dependencies.expenseService = {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString()
      };
      healthStatus.connectivity.expense_service = false;
    }

    // Test event publishing capability
    try {
      if (redisManager.isConnected) {
        const testResult = await redisManager.publish('health.test', {
          type: 'health_check',
          service: 'budget-service',
          timestamp: new Date().toISOString()
        });
        healthStatus.features.event_processing = testResult;
      }
    } catch (error) {
      healthStatus.features.event_processing = false;
    }

    // Overall service communication status
    healthStatus.features.service_communication = 
      healthStatus.connectivity.auth_service && 
      healthStatus.connectivity.expense_service;

    // Determine overall health
    const criticalDependencies = [
      healthStatus.dependencies.redis?.status === 'healthy'
    ];

    const isHealthy = criticalDependencies.every(dep => dep === true);
    healthStatus.status = isHealthy ? 'healthy' : 'degraded';

    // Add warnings for non-critical issues
    if (!healthStatus.connectivity.auth_service || !healthStatus.connectivity.expense_service) {
      healthStatus.warnings = healthStatus.warnings || [];
      healthStatus.warnings.push('Some external services are unavailable');
    }

    return healthStatus;
  }

  /**
   * Quick health check for load balancers
   */
  async quickHealthCheck() {
    return {
      status: 'healthy',
      service: 'budget-service',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Deep health check with service tests
   */
  async deepHealthCheck() {
    const healthStatus = await this.performHealthCheck();

    // Add more detailed checks
    healthStatus.detailed_checks = {
      database_connectivity: await this.checkDatabaseConnection(),
      event_subscriber_status: await this.checkEventSubscribers(),
      service_authentication: await this.checkServiceAuthentication()
    };

    return healthStatus;
  }

  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    try {
      // TODO: Add actual database connection check
      return {
        status: 'healthy',
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }

  /**
   * Check event subscriber status
   */
  async checkEventSubscribers() {
    try {
      // Check if event subscribers are running
      return {
        status: redisManager.subscriberClient ? 'active' : 'inactive',
        subscribers: ['expense.created', 'expense.updated', 'expense.deleted'],
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }

  /**
   * Check service authentication capability
   */
  async checkServiceAuthentication() {
    try {
      const authResult = await authServiceClient.authenticate();
      return {
        status: authResult.success ? 'working' : 'failed',
        has_token: !!authResult.token,
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    };
  }
}

module.exports = new HealthCheckService();