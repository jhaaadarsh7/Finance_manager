const { BudgetSpending } = require('../models');

class SpendingService {
  /**
   * Records a new spending event for a budget.
   * @param {Object} data - The spending data.
   * @param {number} data.budget_id - The related budget's id.
   * @param {number} data.expense_id - The expense's id (from expense service).
   * @param {number} data.amount - The amount spent.
   * @param {Date|string} data.spending_date - The date of the spending.
   * @param {string} [data.description] - (Optional) Description.
   * @returns {Promise<BudgetSpending>}
   */
  static async addSpending(data) {
    // You can add validation or enrichment logic here if needed
    return BudgetSpending.create({
      budget_id: data.budget_id,
      expense_id: data.expense_id,
      amount: data.amount,
      spending_date: data.spending_date,
      description: data.description || null
    });
  }

  // Optionally: Add a method to get spendings for a budget
  static async getSpendingsByBudget(budget_id) {
    return BudgetSpending.findAll({ where: { budget_id } });
  }
}

module.exports = SpendingService;