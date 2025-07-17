const redisManager = require('../config/redis');
const budgetService = require('../services/budgetService');
const budgetEventPublisher = require('./budgetEventPublisher');


class ExpenseEventSubscriber {

    async initialize() {
         // Subscribe to expense events
    await redisManager.subscribe('expense.created', this.handleExpenseCreated.bind(this));
    await redisManager.subscribe('expense.updated', this.handleExpenseUpdated.bind(this));
    await redisManager.subscribe('expense.deleted', this.handleExpenseDeleted.bind(this));
    
    console.log('Expense event subscriber initialized');
    }
      // Handle when an expense is created
  async handleExpenseCreated(event) {
    try {
      console.log('Processing expense created event:', event);
      
      const { userId, categoryId, amount, expenseId } = event;
      
      // Find budgets that this expense affects
      const affectedBudgets = await budgetService.findBudgetsByUserAndCategory(userId, categoryId);
      
      for (const budget of affectedBudgets) {
        // Update budget spending
        const updatedSpending = await budgetService.updateBudgetSpending(budget.id, amount, 'add');
        
        // Publish spending update event
        await budgetEventPublisher.publishSpendingUpdated(
          budget, 
          updatedSpending.spent_amount, 
          updatedSpending.spent_amount - amount
        );
        
        // Check if budget thresholds are exceeded
        await this.checkBudgetThresholds(budget, updatedSpending.spent_amount);
      }
    } catch (error) {
      console.error('Error handling expense created event:', error);
    }
  }
    // Handle when an expense is updated
  async handleExpenseUpdated(event) {
    try {
      console.log('Processing expense updated event:', event);
      
      const { userId, categoryId, amount, oldAmount, expenseId } = event;
      const amountDifference = amount - oldAmount;
      
      // Find affected budgets
      const affectedBudgets = await budgetService.findBudgetsByUserAndCategory(userId, categoryId);
      
      for (const budget of affectedBudgets) {
        // Update budget spending with the difference
        const updatedSpending = await budgetService.updateBudgetSpending(
          budget.id, 
          amountDifference, 
          amountDifference > 0 ? 'add' : 'subtract'
        );
        
        // Publish spending update event
        await budgetEventPublisher.publishSpendingUpdated(
          budget, 
          updatedSpending.spent_amount, 
          updatedSpending.spent_amount - amountDifference
        );
        
        // Check thresholds
        await this.checkBudgetThresholds(budget, updatedSpending.spent_amount);
      }
    } catch (error) {
      console.error('Error handling expense updated event:', error);
    }
  }

  // Handle when an expense is deleted
  async handleExpenseDeleted(event) {
    try {
      console.log('Processing expense deleted event:', event);
      
      const { userId, categoryId, amount, expenseId } = event;
      
      // Find affected budgets
      const affectedBudgets = await budgetService.findBudgetsByUserAndCategory(userId, categoryId);
      
      for (const budget of affectedBudgets) {
        // Subtract the expense amount from budget spending
        const updatedSpending = await budgetService.updateBudgetSpending(budget.id, amount, 'subtract');
        
        // Publish spending update event
        await budgetEventPublisher.publishSpendingUpdated(
          budget, 
          updatedSpending.spent_amount, 
          updatedSpending.spent_amount + amount
        );
      }
    } catch (error) {
      console.error('Error handling expense deleted event:', error);
    }
  }

  // Check if budget has exceeded thresholds
  async checkBudgetThresholds(budget, currentSpending) {
    const percentage = (currentSpending / budget.amount) * 100;
    
    if (percentage >= 100) {
      // Budget exceeded
      await budgetEventPublisher.publishBudgetExceeded(budget, currentSpending, 'critical');
    } else if (percentage >= 80) {
      // Warning threshold
      await budgetEventPublisher.publishBudgetExceeded(budget, currentSpending, 'warning');
    }
  }
}

module.exports = new ExpenseEventSubscriber();