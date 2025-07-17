const redis = require('redis');

class RedisManager {
  constructor() {
    this.publisherClient = null;
    this.subscriberClient = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('Connecting to Redis at', process.env.REDIS_HOST, process.env.REDIS_PORT);
      
      // Create publisher client
      this.publisherClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        }
      });

      // Create subscriber client (separate connection for Redis pub/sub)
      this.subscriberClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        }
      });

      // Error handlers
      this.publisherClient.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
        this.isConnected = false;
      });

      this.subscriberClient.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
      });

      // Connection handlers
      this.publisherClient.on('connect', () => {
        console.log('Redis publisher client connected');
      });

      this.subscriberClient.on('connect', () => {
        console.log('Redis subscriber client connected');
      });

      this.publisherClient.on('ready', () => {
        console.log('Redis publisher client ready');
        this.isConnected = true;
      });

      this.subscriberClient.on('ready', () => {
        console.log('Redis subscriber client ready');
      });

      // Connect both clients
      await Promise.all([
        this.publisherClient.connect(),
        this.subscriberClient.connect()
      ]);

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async publish(channel, message) {
    if (!this.isConnected || !this.publisherClient) {
      console.error('Redis publisher client not connected');
      return false;
    }

    try {
      const result = await this.publisherClient.publish(channel, JSON.stringify(message));
      console.log(`Published message to ${channel}:`, message);
      return result > 0; // Number of subscribers that received the message
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  async subscribe(channel, messageHandler) {
    if (!this.subscriberClient) {
      console.error('Redis subscriber client not available');
      return false;
    }

    try {
      await this.subscriberClient.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`Received message from ${channel}:`, parsedMessage);
          messageHandler(parsedMessage);
        } catch (error) {
          console.error('Error parsing received message:', error);
        }
      });
      console.log(`Subscribed to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      const promises = [];
      if (this.publisherClient) {
        promises.push(this.publisherClient.disconnect());
      }
      if (this.subscriberClient) {
        promises.push(this.subscriberClient.disconnect());
      }
      await Promise.all(promises);
      this.isConnected = false;
      console.log('Redis clients disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis clients:', error);
    }
  }
}

module.exports = new RedisManager();