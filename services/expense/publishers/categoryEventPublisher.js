const RedisPublisher = require("../src/config/redis");

class CategoryEventPublisher {
  static CHANNELS = {
    CREATED: 'expense.category.created',
    UPDATED: 'expense.category.updated',
    DELETED: 'expense.category.deleted'
  };

  static async publishCreated(category) {
    return RedisPublisher.publish(this.CHANNELS.CREATED, {
      eventType: 'CREATED',
      timestamp: new Date(),
      data: category,
    });
  }

  static async publishUpdated(category) {
    return RedisPublisher.publish(this.CHANNELS.UPDATED, {
      eventType: 'UPDATED',
      timestamp: new Date(),
      data: category,
    });
  }

  static async publishDeleted(categoryId, userId) {
    return RedisPublisher.publish(this.CHANNELS.DELETED, {
      eventType: 'DELETED',
      timestamp: new Date(),
      data: { id: categoryId, userId },
    });
  }
}

module.exports = CategoryEventPublisher;
