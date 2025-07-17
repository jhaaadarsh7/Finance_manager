const httpClient = require('./httpClient');

class AuthServiceClient {
  constructor() {
    this.baseURL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
  }

  // Validate JWT token
  async validateToken(token) {
    try {
      const response = await httpClient.get('/profile', {
        baseURL: this.baseURL,
        token
      });

      return {
        valid: true,
        user: response
      };
    } catch (error) {
      console.error('Token validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get user profile
  async getUserProfile(userId, token) {
    try {
      return await httpClient.get('/profile', {
        baseURL: this.baseURL,
        token
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  // Verify user exists and is active
  async verifyUser(userId, token) {
    try {
      const profile = await this.getUserProfile(userId, token);
      return {
        exists: true,
        active: true,
        user: profile
      };
    } catch (error) {
      console.error('User verification failed:', error);
      return {
        exists: false,
        active: false,
        error: error.message
      };
    }
  }

  // Health check for auth service
  async healthCheck() {
    return await httpClient.healthCheck(this.baseURL);
  }

  // Create service-to-service authentication token (if needed)
  async getServiceToken() {
    try {
      // This would be used for service-to-service communication
      // For now, we'll rely on user tokens being passed through
      return null;
    } catch (error) {
      console.error('Error getting service token:', error);
      throw new Error(`Failed to get service token: ${error.message}`);
    }
  }
}

module.exports = new AuthServiceClient();