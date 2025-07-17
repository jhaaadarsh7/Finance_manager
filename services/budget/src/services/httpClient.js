const axios = require('axios');


class HttpClient{
    constructor(){
          this.defaultTimeout = 5000; // 5 seconds
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second  
    }


    createClient(baseURL,options={}) {
 return axios.create({
      baseURL,
      timeout: options.timeout || this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'budget-service/1.0',
        ...options.headers
      }
    });
    }
     // Retry logic with exponential backoff
  async retry(fn, retries = this.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`Request failed, retrying in ${this.retryDelay}ms. Retries left: ${retries}`);
        await this.delay(this.retryDelay);
        return this.retry(fn, retries - 1);
      }
      throw error;
    }
  }
   // Check if error is retryable
  isRetryableError(error) {
    if (!error.response) {
      // Network error, DNS error, etc.
      return true;
    }
    
    const status = error.response.status;
    // Retry on 5xx errors and specific 4xx errors
    return status >= 500 || status === 408 || status === 429;
  }
   // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET request with retry
  async get(url, config = {}) {
    const client = this.createClient(config.baseURL, config);
    
    return this.retry(async () => {
      const response = await client.get(url, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: config.token ? `Bearer ${config.token}` : undefined
        }
      });
      return response.data;
    });
  }
    // POST request with retry
  async post(url, data, config = {}) {
    const client = this.createClient(config.baseURL, config);
    
    return this.retry(async () => {
      const response = await client.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: config.token ? `Bearer ${config.token}` : undefined
        }
      });
      return response.data;
    });
  }
    // PUT request with retry
  async put(url, data, config = {}) {
    const client = this.createClient(config.baseURL, config);
    
    return this.retry(async () => {
      const response = await client.put(url, data, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: config.token ? `Bearer ${config.token}` : undefined
        }
      });
      return response.data;
    });
  }
  // DELETE request with retry
  async delete(url, config = {}) {
    const client = this.createClient(config.baseURL, config);
    
    return this.retry(async () => {
      const response = await client.delete(url, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: config.token ? `Bearer ${config.token}` : undefined
        }
      });
      return response.data;
    });
  }
  async healthCheck(serviceUrl) {
    try {
      const response = await this.get('/health', {
        baseURL: serviceUrl,
        timeout: 3000 // Shorter timeout for health checks
      });
      return {
        healthy: true,
        status: response.status,
        service: response.service,
        timestamp: response.timestamp
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}  
module.exports = new HttpClient();
