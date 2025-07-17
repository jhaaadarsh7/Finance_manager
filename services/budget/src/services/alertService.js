const { Budget, BudgetAlert, BudgetAlertHistory, BudgetSpending } = require('../models');

class AlertService {
  /**
   * Checks for all alerts on a budget and triggers/logs if a threshold is crossed.
   * @param {number} budget_id
   */
  static async checkAndTriggerAlerts(budget_id) {
    // Get all alerts for this budget
    const alerts = await BudgetAlert.findAll({ where: { budget_id } });
    if (!alerts.length) return;

    // Get total spent so far
    const spendings = await BudgetSpending.sum('amount', { where: { budget_id } });

    // For each alert, check threshold
    for (const alert of alerts) {
      if (spendings >= alert.threshold) {
        // Check if this alert was already triggered for this threshold in this budget
        const alreadyTriggered = await BudgetAlertHistory.findOne({
          where: { alert_id: alert.id, budget_id, triggered_for: alert.threshold }
        });

        if (!alreadyTriggered) {
          // Log the alert trigger
          await BudgetAlertHistory.create({
            alert_id: alert.id,
            budget_id,
            triggered_at: new Date(),
            triggered_for: alert.threshold
          });
          // Optionally, notify user here (email, push, etc.)
          console.log(`Budget Alert Triggered: Budget ${budget_id}, Threshold ${alert.threshold}`);
        }
      }
    }
  }
}

module.exports = AlertService;