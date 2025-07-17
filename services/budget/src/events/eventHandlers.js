const budgetSyncService = require('../services/budgetSyncService');
const alertService = require('../services/alertService');

class ExpenseEventHandler {
  /**
   * Handle expense created events
   * @param {Object} expenseData - The created expense data
   */
  static async onExpenseCreated(expenseData) {
    try {
      console.log(`Processing expense created event for user ${expenseData.userId}, category: ${expenseData.category}, amount: ${expenseData.amount}`);

      // Update budget spending for the expense category
      await budgetSyncService.updateBudgetSpending(
        expenseData.userId,
        expenseData.category,
        expenseData.amount,
        'add',
        expenseData.date
      );

      // Check if any budget thresholds are exceeded
      await this.checkBudgetThresholds(expenseData.userId, expenseData.category);

    } catch (error) {
      console.error('Error processing expense created event:', error);
    }
  }

  /**
   * Handle expense updated events
   * @param {Object} expenseData - The updated expense data
   * @param {Object} previousData - The previous expense data
   */
  static async onExpenseUpdated(expenseData, previousData) {
    try {
      console.log(`Processing expense updated event for user ${expenseData.userId}`);

      // If category changed, handle the change
      if (previousData && previousData.category !== expenseData.category) {
        // Remove from old category
        await budgetSyncService.updateBudgetSpending(
          expenseData.userId,
          previousData.category,
          previousData.amount,
          'subtract',
          previousData.date
        );

        // Add to new category
        await budgetSyncService.updateBudgetSpending(
          expenseData.userId,
          expenseData.category,
          expenseData.amount,
          'add',
          expenseData.date
        );

        // Check thresholds for both categories
        await this.checkBudgetThresholds(expenseData.userId, previousData.category);
        await this.checkBudgetThresholds(expenseData.userId, expenseData.category);
      }
      // If amount changed
      else if (previousData && previousData.amount !== expenseData.amount) {
        const amountDifference = expenseData.amount - previousData.amount;
        const operation = amountDifference > 0 ? 'add' : 'subtract';
        
        await budgetSyncService.updateBudgetSpending(
          expenseData.userId,
          expenseData.category,
          Math.abs(amountDifference),
          operation,
          expenseData.date
        );

        await this.checkBudgetThresholds(expenseData.userId, expenseData.category);
      }

    } catch (error) {
      console.error('Error processing expense updated event:', error);
    }
  }

  /**
   * Handle expense deleted events
   * @param {Object} expenseData - The deleted expense data (id, userId, and previous expense details)
   */
  static async onExpenseDeleted(expenseData) {
    try {
      console.log(`Processing expense deleted event for user ${expenseData.userId}`);

      // If we have the previous expense data, subtract from budget
      if (expenseData.amount && expenseData.category) {
        await budgetSyncService.updateBudgetSpending(
          expenseData.userId,
          expenseData.category,
          expenseData.amount,
          'subtract',
          expenseData.date
        );

        await this.checkBudgetThresholds(expenseData.userId, expenseData.category);
      } else {
        // If we don't have complete data, trigger a full sync for the user
        console.log(`Incomplete expense data for deletion, triggering full sync for user ${expenseData.userId}`);
        await budgetSyncService.syncUserBudgets(expenseData.userId);
      }

    } catch (error) {
      console.error('Error processing expense deleted event:', error);
    }
  }

  /**
   * Check budget thresholds and trigger alerts if necessary
   * @param {string} userId - User ID
   * @param {string} category - Expense category
   */
  static async checkBudgetThresholds(userId, category) {
    try {
      const budgets = await budgetSyncService.getUserBudgetsByCategory(userId, category);
      
      for (const budget of budgets) {
        const spentPercentage = (budget.spent / budget.amount) * 100;
        
        // Check for budget exceeded (100%+)
        if (budget.spent > budget.amount) {
          await alertService.triggerBudgetExceededAlert(budget);
        }
        // Check for warning threshold (80%+)
        else if (spentPercentage >= 80 && !budget.warningTriggered) {
          await alertService.triggerBudgetWarningAlert(budget);
        }
      }
    } catch (error) {
      console.error('Error checking budget thresholds:', error);
    }
  }

  /**
   * Handle batch expense events (for recovery scenarios)
   * @param {Array} expenseEvents - Array of expense events
   */
  static async handleBatchEvents(expenseEvents) {
    try {
      console.log(`Processing batch of ${expenseEvents.length} expense events`);
      
      const userCategories = new Set();
      
      for (const event of expenseEvents) {
        try {
          switch (event.eventType) {
            case 'CREATED':
              await this.onExpenseCreated(event.data);
              break;
            case 'UPDATED':
              await this.onExpenseUpdated(event.data, event.previousData);
              break;
            case 'DELETED':
              await this.onExpenseDeleted(event.data);
              break;
          }
          
          userCategories.add(`${event.data.userId}:${event.data.category}`);
        } catch (error) {
          console.error(`Error processing batch event ${event.eventType}:`, error);
        }
      }

      // Check thresholds for all affected user/category combinations
      for (const userCategory of userCategories) {
        const [userId, category] = userCategory.split(':');
        await this.checkBudgetThresholds(userId, category);
      }

    } catch (error) {
      console.error('Error processing batch expense events:', error);
    }
  }
}

module.exports = ExpenseEventHandler;