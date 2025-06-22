const redis = require('redis');

class RedisPublisher {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('Trying to connect to Redis at', process.env.REDIS_HOST, process.env.REDIS_PORT);
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async publish(channel, message) {
    if (!this.isConnected || !this.client) {
      console.error('Redis client not connected');
      return false;
    }

    try {
      const result = await this.client.publish(channel, JSON.stringify(message));
      return result > 0; // Number of subscribers that received the message
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisPublisher();
