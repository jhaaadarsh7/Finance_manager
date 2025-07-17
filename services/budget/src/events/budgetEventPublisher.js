const redisManager = require("../config/redis");


class BudgetEventPublisher {

    async publishBudgetAlert(budget) {
           return await redisManager.publish('budget.created', {
      eventType: 'budget.created',
      budgetId: budget.id,
      userId: budget.user_id,
      categoryId: budget.category_id,
      amount: budget.amount,
      period: budget.period,
      data: budget
    }); 
    }
     // Publish when a budget is updated
  async publishBudgetUpdated(budget, oldBudget) {
    return await redisManager.publish('budget.updated', {
      eventType: 'budget.updated',
      budgetId: budget.id,
      userId: budget.user_id,
      categoryId: budget.category_id,
      changes: {
        amount: { old: oldBudget.amount, new: budget.amount },
        period: { old: oldBudget.period, new: budget.period }
      },
      data: budget
    });
  }
    // Publish when a budget is deleted
  async publishBudgetDeleted(budget) {
    return await redisManager.publish('budget.deleted', {
      eventType: 'budget.deleted',
      budgetId: budget.id,
      userId: budget.user_id,
      categoryId: budget.category_id,
      data: budget
    });
  }
    // Publish when budget spending is updated
  async publishSpendingUpdated(budget, spentAmount, previousAmount) {
    return await redisManager.publish('budget.spending.updated', {
      eventType: 'budget.spending.updated',
      budgetId: budget.id,
      userId: budget.user_id,
      categoryId: budget.category_id,
      spentAmount,
      previousAmount,
      budgetAmount: budget.amount,
      percentageUsed: (spentAmount / budget.amount) * 100
    });
  }
    // Publish when budget threshold is exceeded
  async publishBudgetExceeded(budget, spentAmount, thresholdType) {
    return await redisManager.publish('budget.exceeded', {
      eventType: 'budget.exceeded',
      budgetId: budget.id,
      userId: budget.user_id,
      categoryId: budget.category_id,
      budgetAmount: budget.amount,
      spentAmount,
      excessAmount: spentAmount - budget.amount,
      percentageUsed: (spentAmount / budget.amount) * 100,
      thresholdType, // 'warning' (80%), 'danger' (100%), 'critical' (>100%)
      data: budget
    });
  }
    // Publish budget health status
  async publishBudgetHealth(userId, budgetHealthData) {
    return await redisManager.publish('budget.health', {
      eventType: 'budget.health',
      userId,
      totalBudgets: budgetHealthData.totalBudgets,
      healthyBudgets: budgetHealthData.healthyBudgets,
      warningBudgets: budgetHealthData.warningBudgets,
      exceededBudgets: budgetHealthData.exceededBudgets,
      overallHealthScore: budgetHealthData.overallHealthScore,
      data: budgetHealthData
    });
  }
}

module.exports = new BudgetEventPublisher();