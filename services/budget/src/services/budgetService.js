const { Budget, BudgetSpending, BudgetAlert, BudgetAlertHistory } = require('../models');

class BudgetService {
  // Create a new budget
  static async createBudget(data) {
    return Budget.create(data);
  }

  // Get a budget by id
  static async getBudgetById(id) {
    return Budget.findByPk(id, {
      include: [
        { model: BudgetSpending, as: 'spendings' },
        { model: BudgetAlert, as: 'alerts' },
        { model: BudgetAlertHistory, as: 'alertHistories' }
      ]
    });
  }

  // Update a budget by id
  static async updateBudget(id, updates) {
    const [count, [budget]] = await Budget.update(updates, {
      where: { id },
      returning: true,
    });
    return budget;
  }

  // Delete a budget by id
  static async deleteBudget(id) {
    return Budget.destroy({ where: { id } });
  }

  // List all budgets for a user
  static async getBudgetsForUser(user_id) {
    return Budget.findAll({
      where: { user_id },
      include: [
        { model: BudgetSpending, as: 'spendings' },
        { model: BudgetAlert, as: 'alerts' },
      ]
    });
  }
}

module.exports = BudgetService;