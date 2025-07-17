const httpClient = require('./httpClient');

class ExpenseServiceClient {
  constructor() {
    this.baseUrl = process.env.EXPENSE_SERVICE_URL || 'http://expense-service:3001';
  }

  async getExpensesByUser(userId, token) {
    try {
      const response = await httpClient.get(
        `${this.baseUrl}/api/expenses/user/${userId}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        expenses: response.data || []
      };
    } catch (error) {
      console.error(`Failed to fetch expenses for user ${userId}:`, error.message);
      return {
        success: false,
        expenses: [],
        error: error.message
      };
    }
  }

  async getExpensesByCategory(userId, category, token) {
    try {
      const response = await httpClient.get(
        `${this.baseUrl}/api/expenses/user/${userId}/category/${category}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        expenses: response.data || []
      };
    } catch (error) {
      console.error(`Failed to fetch expenses for user ${userId} category ${category}:`, error.message);
      return {
        success: false,
        expenses: [],
        error: error.message
      };
    }
  }

  async getExpenseById(expenseId, token) {
    try {
      const response = await httpClient.get(
        `${this.baseUrl}/api/expenses/${expenseId}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        expense: response.data
      };
    } catch (error) {
      console.error(`Failed to fetch expense ${expenseId}:`, error.message);
      return {
        success: false,
        expense: null,
        error: error.message
      };
    }
  }

  async getExpensesSummary(userId, startDate, endDate, token) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await httpClient.get(
        `${this.baseUrl}/api/expenses/user/${userId}/summary?${params.toString()}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        summary: response.data
      };
    } catch (error) {
      console.error(`Failed to fetch expense summary for user ${userId}:`, error.message);
      return {
        success: false,
        summary: null,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const response = await httpClient.get(`${this.baseUrl}/health`);
      return {
        success: true,
        status: response.status,
        service: 'expense-service'
      };
    } catch (error) {
      console.error('Expense service health check failed:', error.message);
      return {
        success: false,
        status: 'unhealthy',
        service: 'expense-service',
        error: error.message
      };
    }
  }

  // Get expenses within a specific date range for budget calculations
  async getExpensesInDateRange(userId, startDate, endDate, category = null, token) {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      if (category) {
        params.append('category', category);
      }

      const response = await httpClient.get(
        `${this.baseUrl}/api/expenses/user/${userId}/range?${params.toString()}`,
        httpClient.createAuthHeaders(token)
      );
      return {
        success: true,
        expenses: response.data || []
      };
    } catch (error) {
      console.error(`Failed to fetch expenses in date range for user ${userId}:`, error.message);
      return {
        success: false,
        expenses: [],
        error: error.message
      };
    }
  }
}

module.exports = new ExpenseServiceClient();