const redis = require("redis");

class RedisManager {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log(
        "Connecting to Redis at",
        process.env.REDIS_HOST,
        process.env.REDIS_PORT
      );

      this.publisher = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || "redis",
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        },
      });
      this.subscriber = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || "redis",
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        },
      });

      this.publisher.on("error", (err) => {
        console.error("Redis Publisher Error:", err);
        this.isConnected = false;
      });
            this.subscriber.on("error", (err) => {
        console.error("Redis Subscriber Error:", err);
        this.isConnected = false;
      });

         // Set up connection handlers
      this.publisher.on('connect', () => {
        console.log('Redis publisher connected');
      });

      this.subscriber.on('connect', () => {
        console.log('Redis subscriber connected');
      });

      this.publisher.on('ready', () => {
        console.log('Redis publisher ready');
        this.isConnected = true;
      });


      await this.publisher.connect();
      await this.subscriber.connect();
      console.log("Connected to Redis successfully");
    } catch (error) {
            console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

    // Publish events to other services
  async publish(channel, message) {
    if (!this.isConnected || !this.publisher) {
      console.error('Redis publisher not connected');
      return false;
    }
try {
          const messageString = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        service: 'budget-service'
      });
      
      const result = await this.publisher.publish(channel, messageString);
      console.log(`Published event to ${channel}:`, message);
      return result > 0;
} catch (error) {
         console.error('Error publishing message:', error);
      return false;
}

}
  // Subscribe to events from other services
  async subscribe(channel, handler) {
    if (!this.subscriber) {
      console.error('Redis subscriber not connected');
      return;
    }

    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`Received event from ${channel}:`, parsedMessage);
          handler(parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
      
      console.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`Error subscribing to ${channel}:`, error);
    }
  }
async disconnect() {
    try {
      if (this.publisher) {
        await this.publisher.disconnect();
      }
      if (this.subscriber) {
        await this.subscriber.disconnect();
      }
      this.isConnected = false;
      console.log('Redis clients disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}


const redisManager = new RedisManager();
module.exports = redisManager;