const redisManager = require('../config/redis');

class BudgetEventPublisher {
  static CHANNELS = {
    CREATED: 'budget.created',
    UPDATED: 'budget.updated',
    DELETED: 'budget.deleted',
    EXCEEDED: 'budget.exceeded',
    WARNING: 'budget.warning',
    RESET: 'budget.reset'
  };

  static async publishCreated(budget) {
    try {
      const event = {
        eventType: 'CREATED',
        timestamp: new Date().toISOString(),
        data: {
          id: budget.id,
          userId: budget.userId,
          category: budget.category,
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate
        },
        service: 'budget-service'
      };

      const result = await redisManager.publish(this.CHANNELS.CREATED, event);
      console.log(`Published budget created event for budget ${budget.id}`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget created event:', error);
      return false;
    }
  }

  static async publishUpdated(budget, oldBudget = null) {
    try {
      const event = {
        eventType: 'UPDATED',
        timestamp: new Date().toISOString(),
        data: {
          id: budget.id,
          userId: budget.userId,
          category: budget.category,
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          spent: budget.spent,
          remaining: budget.remaining
        },
        previousData: oldBudget,
        service: 'budget-service'
      };

      const result = await redisManager.publish(this.CHANNELS.UPDATED, event);
      console.log(`Published budget updated event for budget ${budget.id}`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget updated event:', error);
      return false;
    }
  }

  static async publishDeleted(budgetId, userId) {
    try {
      const event = {
        eventType: 'DELETED',
        timestamp: new Date().toISOString(),
        data: {
          id: budgetId,
          userId: userId
        },
        service: 'budget-service'
      };

      const result = await redisManager.publish(this.CHANNELS.DELETED, event);
      console.log(`Published budget deleted event for budget ${budgetId}`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget deleted event:', error);
      return false;
    }
  }

  static async publishExceeded(budget, overspent) {
    try {
      const event = {
        eventType: 'EXCEEDED',
        timestamp: new Date().toISOString(),
        data: {
          id: budget.id,
          userId: budget.userId,
          category: budget.category,
          budgetAmount: budget.amount,
          spent: budget.spent,
          overspent: overspent,
          percentage: ((budget.spent / budget.amount) * 100).toFixed(2)
        },
        service: 'budget-service',
        priority: 'high'
      };

      const result = await redisManager.publish(this.CHANNELS.EXCEEDED, event);
      console.log(`Published budget exceeded event for budget ${budget.id} - overspent by ${overspent}`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget exceeded event:', error);
      return false;
    }
  }

  static async publishWarning(budget, warningThreshold = 80) {
    try {
      const percentage = (budget.spent / budget.amount) * 100;
      const event = {
        eventType: 'WARNING',
        timestamp: new Date().toISOString(),
        data: {
          id: budget.id,
          userId: budget.userId,
          category: budget.category,
          budgetAmount: budget.amount,
          spent: budget.spent,
          remaining: budget.remaining,
          percentage: percentage.toFixed(2),
          threshold: warningThreshold
        },
        service: 'budget-service',
        priority: 'medium'
      };

      const result = await redisManager.publish(this.CHANNELS.WARNING, event);
      console.log(`Published budget warning event for budget ${budget.id} - ${percentage.toFixed(2)}% spent`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget warning event:', error);
      return false;
    }
  }

  static async publishReset(budget) {
    try {
      const event = {
        eventType: 'RESET',
        timestamp: new Date().toISOString(),
        data: {
          id: budget.id,
          userId: budget.userId,
          category: budget.category,
          amount: budget.amount,
          period: budget.period,
          newStartDate: budget.startDate,
          newEndDate: budget.endDate
        },
        service: 'budget-service'
      };

      const result = await redisManager.publish(this.CHANNELS.RESET, event);
      console.log(`Published budget reset event for budget ${budget.id}`);
      return result;
    } catch (error) {
      console.error('Failed to publish budget reset event:', error);
      return false;
    }
  }
}

module.exports = BudgetEventPublisher;