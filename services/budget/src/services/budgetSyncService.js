const expenseServiceClient = require('./expenseServiceClient');
const authServiceClient = require('./authServiceClient');
const BudgetEventPublisher = require('../events/budgetEventPublisher');

class BudgetSyncService {
  /**
   * Update budget spending based on expense changes
   * @param {string} userId - User ID
   * @param {string} category - Expense category
   * @param {number} amount - Amount to add or subtract
   * @param {string} operation - 'add' or 'subtract'
   * @param {string} expenseDate - Date of the expense
   */
  async updateBudgetSpending(userId, category, amount, operation = 'add', expenseDate = null) {
    try {
      console.log(`Updating budget spending for user ${userId}, category ${category}, amount ${amount}, operation ${operation}`);

      // Get user's budgets for this category
      const budgets = await this.getUserBudgetsByCategory(userId, category);

      if (budgets.length === 0) {
        console.log(`No budgets found for user ${userId} in category ${category}`);
        return;
      }

      for (const budget of budgets) {
        // Check if expense falls within budget period
        if (expenseDate && !this.isExpenseInBudgetPeriod(expenseDate, budget)) {
          console.log(`Expense date ${expenseDate} not in budget period for budget ${budget.id}`);
          continue;
        }

        const oldSpent = budget.spent || 0;
        let newSpent;

        if (operation === 'add') {
          newSpent = oldSpent + amount;
        } else if (operation === 'subtract') {
          newSpent = Math.max(0, oldSpent - amount); // Don't let spent go negative
        } else {
          console.error(`Invalid operation: ${operation}`);
          continue;
        }

        // Update budget spent amount
        const updatedBudget = await this.updateBudgetInDatabase(budget.id, {
          spent: newSpent,
          remaining: budget.amount - newSpent
        });

        if (updatedBudget) {
          // Publish budget updated event
          await BudgetEventPublisher.publishUpdated(updatedBudget, budget);
          
          console.log(`Updated budget ${budget.id}: spent ${oldSpent} -> ${newSpent}`);
        }
      }

    } catch (error) {
      console.error('Error updating budget spending:', error);
      throw error;
    }
  }

  /**
   * Sync all budgets for a user with actual expense data
   * @param {string} userId - User ID
   * @param {string} token - User's auth token (optional, will get service token if not provided)
   */
  async syncUserBudgets(userId, token = null) {
    try {
      console.log(`Starting full budget sync for user ${userId}`);

      // Get service token if user token not provided
      if (!token) {
        const authResult = await authServiceClient.authenticate();
        if (!authResult.success) {
          throw new Error('Failed to get service authentication token');
        }
        token = authResult.token;
      }

      // Get all user budgets
      const budgets = await this.getUserBudgets(userId);
      
      if (budgets.length === 0) {
        console.log(`No budgets found for user ${userId}`);
        return;
      }

      for (const budget of budgets) {
        await this.syncBudgetWithExpenses(budget, token);
      }

      console.log(`Completed budget sync for user ${userId}`);
    } catch (error) {
      console.error(`Error syncing budgets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Sync a specific budget with expense data
   * @param {Object} budget - Budget object
   * @param {string} token - Auth token
   */
  async syncBudgetWithExpenses(budget, token) {
    try {
      console.log(`Syncing budget ${budget.id} for category ${budget.category}`);

      // Get expenses for this budget's category and period
      const expensesResult = await expenseServiceClient.getExpensesInDateRange(
        budget.userId,
        budget.startDate,
        budget.endDate,
        budget.category,
        token
      );

      if (!expensesResult.success) {
        console.error(`Failed to fetch expenses for budget ${budget.id}:`, expensesResult.error);
        return;
      }

      // Calculate total spent
      const totalSpent = expensesResult.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = budget.amount - totalSpent;

      // Update budget if spending has changed
      if (totalSpent !== budget.spent) {
        const updatedBudget = await this.updateBudgetInDatabase(budget.id, {
          spent: totalSpent,
          remaining: remaining
        });

        if (updatedBudget) {
          await BudgetEventPublisher.publishUpdated(updatedBudget, budget);
          console.log(`Synced budget ${budget.id}: spent updated to ${totalSpent}`);
        }
      }

    } catch (error) {
      console.error(`Error syncing budget ${budget.id}:`, error);
    }
  }

  /**
   * Get user budgets by category
   * @param {string} userId - User ID
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of budget objects
   */
  async getUserBudgetsByCategory(userId, category) {
    try {
      // This would typically query the database
      // For now, returning mock data structure
      // TODO: Implement actual database query
      console.log(`Getting budgets for user ${userId}, category ${category}`);
      
      // Mock implementation - replace with actual database query
      return [];
    } catch (error) {
      console.error('Error getting user budgets by category:', error);
      return [];
    }
  }

  /**
   * Get all budgets for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of budget objects
   */
  async getUserBudgets(userId) {
    try {
      // TODO: Implement actual database query
      console.log(`Getting all budgets for user ${userId}`);
      return [];
    } catch (error) {
      console.error('Error getting user budgets:', error);
      return [];
    }
  }

  /**
   * Update budget in database
   * @param {string} budgetId - Budget ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} Updated budget object
   */
  async updateBudgetInDatabase(budgetId, updates) {
    try {
      // TODO: Implement actual database update
      console.log(`Updating budget ${budgetId} with:`, updates);
      return null;
    } catch (error) {
      console.error('Error updating budget in database:', error);
      return null;
    }
  }

  /**
   * Check if expense date falls within budget period
   * @param {string} expenseDate - Expense date (ISO string)
   * @param {Object} budget - Budget object with startDate and endDate
   * @returns {boolean} True if expense is in budget period
   */
  isExpenseInBudgetPeriod(expenseDate, budget) {
    try {
      const expense = new Date(expenseDate);
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      
      return expense >= start && expense <= end;
    } catch (error) {
      console.error('Error checking expense date against budget period:', error);
      return false;
    }
  }

  /**
   * Calculate budget period dates based on budget type
   * @param {string} period - Budget period ('monthly', 'weekly', 'yearly')
   * @param {Date} startDate - Optional start date
   * @returns {Object} Object with startDate and endDate
   */
  calculateBudgetPeriod(period, startDate = null) {
    const now = startDate || new Date();
    let start, end;

    switch (period.toLowerCase()) {
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'weekly':
        const day = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - day);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        throw new Error(`Unsupported budget period: ${period}`);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }
}

module.exports = new BudgetSyncService();