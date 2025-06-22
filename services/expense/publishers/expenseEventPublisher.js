const RedisPublisher = require("../src/config/redis");

class ExpenseEventPublisher {
  static CHANNELS = {
    CREATED: 'expense.created',
    UPDATED: 'expense.updated',
    DELETED: 'expense.deleted'
  };

  static async publishCreated(expense) {
    return RedisPublisher.publish(this.CHANNELS.CREATED, {
      eventType: 'CREATED',
      timestamp: new Date(),
      data: expense,
    });
  }

  static async publishUpdated(expense) {
    return RedisPublisher.publish(this.CHANNELS.UPDATED, {
      eventType: 'UPDATED',
      timestamp: new Date(),
      data: expense,
    });
  }

  static async publishDeleted(expenseId, userId) {
    return RedisPublisher.publish(this.CHANNELS.DELETED, {
      eventType: 'DELETED',
      timestamp: new Date(),
      data: { id: expenseId, userId },
    });
  }
}

module.exports = ExpenseEventPublisher;
