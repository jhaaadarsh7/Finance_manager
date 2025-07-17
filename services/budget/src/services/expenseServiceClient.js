const httpClient = require('./httpClient');

class ExpenseServiceClient {
  constructor() {
    this.baseURL = process.env.EXPENSE_SERVICE_URL || 'http://expense-service:3001';
  }

  // Get expenses for a user within a date range
  async getUserExpenses(userId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.categoryId) params.append('categoryId', options.categoryId);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const url = `/api/expenses?userId=${userId}&${params.toString()}`;
      
      return await httpClient.get(url, {
        baseURL: this.baseURL,
        token: options.token
      });
    } catch (error) {
      console.error('Error fetching user expenses:', error);
      throw new Error(`Failed to fetch expenses for user ${userId}: ${error.message}`);
    }
  }

  // Get expenses by category for budget calculations
  async getExpensesByCategory(userId, categoryId, startDate, endDate, token) {
    try {
      const params = new URLSearchParams({
        userId,
        categoryId,
        startDate,
        endDate
      });

      const url = `/api/expenses?${params.toString()}`;
      
      const response = await httpClient.get(url, {
        baseURL: this.baseURL,
        token
      });

      // Calculate total spending for the category
      const expenses = response.data || response.expenses || [];
      const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      return {
        expenses,
        totalSpent,
        count: expenses.length
      };
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw new Error(`Failed to fetch expenses for category ${categoryId}: ${error.message}`);
    }
  }

  // Get expense by ID
  async getExpenseById(expenseId, token) {
    try {
      return await httpClient.get(`/api/expenses/${expenseId}`, {
        baseURL: this.baseURL,
        token
      });
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      throw new Error(`Failed to fetch expense ${expenseId}: ${error.message}`);
    }
  }

  // Get categories for budget creation
  async getCategories(token) {
    try {
      return await httpClient.get('/api/categories', {
        baseURL: this.baseURL,
        token
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Get category by ID
  async getCategoryById(categoryId, token) {
    try {
      return await httpClient.get(`/api/categories/${categoryId}`, {
        baseURL: this.baseURL,
        token
      });
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw new Error(`Failed to fetch category ${categoryId}: ${error.message}`);
    }
  }

  // Get expense statistics for budget insights
  async getExpenseStats(userId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.period) params.append('period', options.period);
      if (options.categoryId) params.append('categoryId', options.categoryId);

      const url = `/api/expenses/stats?userId=${userId}&${params.toString()}`;
      
      return await httpClient.get(url, {
        baseURL: this.baseURL,
        token: options.token
      });
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw new Error(`Failed to fetch expense stats for user ${userId}: ${error.message}`);
    }
  }

  // Health check for expense service
  async healthCheck() {
    return await httpClient.healthCheck(this.baseURL);
  }

  // Sync budget spending with actual expenses
  async syncBudgetSpending(budgetId, userId, categoryId, startDate, endDate, token) {
    try {
      console.log(`Syncing budget ${budgetId} spending for category ${categoryId}`);
      
      const expenseData = await this.getExpensesByCategory(
        userId, 
        categoryId, 
        startDate, 
        endDate, 
        token
      );

      return {
        actualSpending: expenseData.totalSpent,
        expenseCount: expenseData.count,
        lastSyncDate: new Date().toISOString(),
        expenses: expenseData.expenses
      };
    } catch (error) {
      console.error('Error syncing budget spending:', error);
      throw new Error(`Failed to sync spending for budget ${budgetId}: ${error.message}`);
    }
  }
}

module.exports = new ExpenseServiceClient();