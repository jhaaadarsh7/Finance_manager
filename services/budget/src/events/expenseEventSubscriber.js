const redisManager = require('../config/redis');
const expenseEventHandler = require('./eventHandlers');

class ExpenseEventSubscriber {
  static CHANNELS = {
    EXPENSE_CREATED: 'expense.created',
    EXPENSE_UPDATED: 'expense.updated',
    EXPENSE_DELETED: 'expense.deleted'
  };

  static async startListening() {
    try {
      console.log('Starting expense event subscribers...');

      // Subscribe to expense created events
      await redisManager.subscribe(
        this.CHANNELS.EXPENSE_CREATED,
        (message) => this.handleExpenseCreated(message)
      );

      // Subscribe to expense updated events
      await redisManager.subscribe(
        this.CHANNELS.EXPENSE_UPDATED,
        (message) => this.handleExpenseUpdated(message)
      );

      // Subscribe to expense deleted events
      await redisManager.subscribe(
        this.CHANNELS.EXPENSE_DELETED,
        (message) => this.handleExpenseDeleted(message)
      );

      console.log('Expense event subscribers started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start expense event subscribers:', error);
      return false;
    }
  }

  static async handleExpenseCreated(message) {
    try {
      console.log('Handling expense created event:', message);
      
      if (!message.data || !message.data.userId || !message.data.amount || !message.data.category) {
        console.error('Invalid expense created event data');
        return;
      }

      await expenseEventHandler.onExpenseCreated(message.data);
    } catch (error) {
      console.error('Error handling expense created event:', error);
    }
  }

  static async handleExpenseUpdated(message) {
    try {
      console.log('Handling expense updated event:', message);
      
      if (!message.data || !message.data.userId || !message.data.amount || !message.data.category) {
        console.error('Invalid expense updated event data');
        return;
      }

      await expenseEventHandler.onExpenseUpdated(message.data, message.previousData);
    } catch (error) {
      console.error('Error handling expense updated event:', error);
    }
  }

  static async handleExpenseDeleted(message) {
    try {
      console.log('Handling expense deleted event:', message);
      
      if (!message.data || !message.data.id || !message.data.userId) {
        console.error('Invalid expense deleted event data');
        return;
      }

      await expenseEventHandler.onExpenseDeleted(message.data);
    } catch (error) {
      console.error('Error handling expense deleted event:', error);
    }
  }

  static async stopListening() {
    try {
      console.log('Stopping expense event subscribers...');
      // Redis client will handle unsubscribing when disconnecting
      await redisManager.disconnect();
      console.log('Expense event subscribers stopped');
      return true;
    } catch (error) {
      console.error('Error stopping expense event subscribers:', error);
      return false;
    }
  }
}

module.exports = ExpenseEventSubscriber;