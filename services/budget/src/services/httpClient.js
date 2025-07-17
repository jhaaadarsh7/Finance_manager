const axios = require('axios');

class HttpClient {
  constructor() {
    this.defaultTimeout = 5000;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async makeRequest(config, retryCount = 0) {
    try {
      const response = await axios({
        timeout: this.defaultTimeout,
        ...config
      });
      return response.data;
    } catch (error) {
      console.error(`HTTP request failed (attempt ${retryCount + 1}):`, {
        url: config.url,
        method: config.method,
        error: error.message,
        status: error.response?.status
      });

      // Retry logic for network errors or 5xx responses
      const shouldRetry = retryCount < this.maxRetries && (
        !error.response || 
        error.response.status >= 500 ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      );

      if (shouldRetry) {
        console.log(`Retrying request in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.makeRequest(config, retryCount + 1);
      }

      throw error;
    }
  }

  async get(url, headers = {}) {
    return this.makeRequest({
      method: 'GET',
      url,
      headers
    });
  }

  async post(url, data, headers = {}) {
    return this.makeRequest({
      method: 'POST',
      url,
      data,
      headers
    });
  }

  async put(url, data, headers = {}) {
    return this.makeRequest({
      method: 'PUT',
      url,
      data,
      headers
    });
  }

  async delete(url, headers = {}) {
    return this.makeRequest({
      method: 'DELETE',
      url,
      headers
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createAuthHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

module.exports = new HttpClient();