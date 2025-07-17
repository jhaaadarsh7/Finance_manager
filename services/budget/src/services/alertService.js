const BudgetEventPublisher = require('../events/budgetEventPublisher');

class AlertService {
  constructor() {
    this.alertThresholds = {
      warning: 80,    // 80% of budget spent
      critical: 100   // Budget exceeded
    };
  }

  /**
   * Trigger budget exceeded alert
   * @param {Object} budget - Budget object that was exceeded
   */
  async triggerBudgetExceededAlert(budget) {
    try {
      console.log(`Triggering budget exceeded alert for budget ${budget.id}`);

      const overspent = budget.spent - budget.amount;
      const percentage = ((budget.spent / budget.amount) * 100).toFixed(2);

      // Publish budget exceeded event
      await BudgetEventPublisher.publishExceeded(budget, overspent);

      // Create alert record
      const alert = await this.createAlert({
        userId: budget.userId,
        budgetId: budget.id,
        type: 'BUDGET_EXCEEDED',
        severity: 'CRITICAL',
        title: `Budget Exceeded: ${budget.category}`,
        message: `Your ${budget.category} budget of $${budget.amount} has been exceeded by $${overspent.toFixed(2)} (${percentage}% spent)`,
        data: {
          budgetAmount: budget.amount,
          spent: budget.spent,
          overspent: overspent,
          percentage: percentage,
          category: budget.category,
          period: budget.period
        }
      });

      // Send notification (integrate with notification service)
      await this.sendNotification(alert);

      console.log(`Budget exceeded alert triggered for budget ${budget.id}`);
      return alert;

    } catch (error) {
      console.error('Error triggering budget exceeded alert:', error);
      throw error;
    }
  }

  /**
   * Trigger budget warning alert
   * @param {Object} budget - Budget object approaching limit
   */
  async triggerBudgetWarningAlert(budget) {
    try {
      console.log(`Triggering budget warning alert for budget ${budget.id}`);

      const percentage = ((budget.spent / budget.amount) * 100).toFixed(2);
      const remaining = budget.amount - budget.spent;

      // Publish budget warning event
      await BudgetEventPublisher.publishWarning(budget, this.alertThresholds.warning);

      // Create alert record
      const alert = await this.createAlert({
        userId: budget.userId,
        budgetId: budget.id,
        type: 'BUDGET_WARNING',
        severity: 'MEDIUM',
        title: `Budget Warning: ${budget.category}`,
        message: `Your ${budget.category} budget is ${percentage}% spent. You have $${remaining.toFixed(2)} remaining.`,
        data: {
          budgetAmount: budget.amount,
          spent: budget.spent,
          remaining: remaining,
          percentage: percentage,
          category: budget.category,
          period: budget.period,
          threshold: this.alertThresholds.warning
        }
      });

      // Mark budget as warning triggered to prevent spam
      await this.markBudgetWarningTriggered(budget.id);

      // Send notification
      await this.sendNotification(alert);

      console.log(`Budget warning alert triggered for budget ${budget.id}`);
      return alert;

    } catch (error) {
      console.error('Error triggering budget warning alert:', error);
      throw error;
    }
  }

  /**
   * Create alert record in database
   * @param {Object} alertData - Alert data
   */
  async createAlert(alertData) {
    try {
      // TODO: Implement database storage for alerts
      console.log('Creating alert:', alertData);
      
      const alert = {
        id: this.generateAlertId(),
        ...alertData,
        createdAt: new Date().toISOString(),
        read: false,
        acknowledged: false
      };

      // Mock implementation - replace with actual database insert
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Send notification to user
   * @param {Object} alert - Alert object
   */
  async sendNotification(alert) {
    try {
      console.log(`Sending notification for alert ${alert.id} to user ${alert.userId}`);

      // TODO: Integrate with notification service
      // This could send emails, push notifications, SMS, etc.
      
      // For now, just log the notification
      console.log('Notification sent:', {
        userId: alert.userId,
        type: alert.type,
        title: alert.title,
        message: alert.message
      });

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Mark budget as having warning triggered
   * @param {string} budgetId - Budget ID
   */
  async markBudgetWarningTriggered(budgetId) {
    try {
      // TODO: Implement database update
      console.log(`Marking budget ${budgetId} as warning triggered`);
      return true;
    } catch (error) {
      console.error('Error marking budget warning triggered:', error);
      return false;
    }
  }

  /**
   * Reset budget warning flags (called when new budget period starts)
   * @param {string} budgetId - Budget ID
   */
  async resetBudgetWarningFlags(budgetId) {
    try {
      // TODO: Implement database update
      console.log(`Resetting warning flags for budget ${budgetId}`);
      return true;
    } catch (error) {
      console.error('Error resetting budget warning flags:', error);
      return false;
    }
  }

  /**
   * Get alerts for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, read status, etc.)
   */
  async getUserAlerts(userId, options = {}) {
    try {
      // TODO: Implement database query
      console.log(`Getting alerts for user ${userId}`, options);
      return [];
    } catch (error) {
      console.error('Error getting user alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID (for security)
   */
  async markAlertAsRead(alertId, userId) {
    try {
      // TODO: Implement database update
      console.log(`Marking alert ${alertId} as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }

  /**
   * Acknowledge alert (user has taken action)
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID (for security)
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      // TODO: Implement database update
      console.log(`Acknowledging alert ${alertId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check all budgets for threshold violations
   * This can be run periodically as a background job
   */
  async checkAllBudgetThresholds() {
    try {
      console.log('Running periodic budget threshold check...');
      
      // TODO: Get all active budgets from database
      // For each budget, check if thresholds are exceeded
      // Trigger appropriate alerts
      
      console.log('Budget threshold check completed');
    } catch (error) {
      console.error('Error in periodic budget threshold check:', error);
    }
  }

  /**
   * Clean up old alerts
   * @param {number} daysOld - Delete alerts older than this many days
   */
  async cleanupOldAlerts(daysOld = 30) {
    try {
      console.log(`Cleaning up alerts older than ${daysOld} days...`);
      
      // TODO: Implement database cleanup
      
      console.log('Alert cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
    }
  }
}

module.exports = new AlertService();
