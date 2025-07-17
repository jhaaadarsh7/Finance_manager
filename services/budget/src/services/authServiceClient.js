const httpClient = require('./httpClient');

class AuthServiceClient {
  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
  }

  async validateToken(token) {
    try {
      const response = await httpClient.get(
        `${this.baseUrl}/api/auth/validate`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        user: response.data?.user,
        isValid: response.success
      };
    } catch (error) {
      console.error('Token validation failed:', error.message);
      return {
        success: false,
        user: null,
        isValid: false,
        error: error.message
      };
    }
  }

  async getUserById(userId, token) {
    try {
      const response = await httpClient.get(
        `${this.baseUrl}/api/users/${userId}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error.message);
      return {
        success: false,
        user: null,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const response = await httpClient.get(`${this.baseUrl}/health`);
      return {
        success: true,
        status: response.status,
        service: 'auth-service'
      };
    } catch (error) {
      console.error('Auth service health check failed:', error.message);
      return {
        success: false,
        status: 'unhealthy',
        service: 'auth-service',
        error: error.message
      };
    }
  }

  // Service-to-service authentication for internal calls
  async authenticate() {
    try {
      // This would typically use a service account or shared secret
      // For now, we'll implement a basic service token approach
      const response = await httpClient.post(`${this.baseUrl}/api/auth/service`, {
        service: 'budget-service',
        secret: process.env.SERVICE_SECRET || 'budget-service-secret'
      });
      
      return {
        success: true,
        token: response.data?.token
      };
    } catch (error) {
      console.error('Service authentication failed:', error.message);
      return {
        success: false,
        token: null,
        error: error.message
      };
    }
  }
}

module.exports = new AuthServiceClient();