class Budget {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.userId;
    this.category = data.category;
    this.amount = parseFloat(data.amount) || 0;
    this.spent = parseFloat(data.spent) || 0;
    this.remaining = this.amount - this.spent;
    this.period = data.period || 'monthly'; // monthly, weekly, yearly
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.warningThreshold = parseFloat(data.warningThreshold) || 80; // percentage
    this.warningTriggered = data.warningTriggered || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Calculate remaining amount
   */
  calculateRemaining() {
    this.remaining = this.amount - this.spent;
    return this.remaining;
  }

  /**
   * Calculate spent percentage
   */
  getSpentPercentage() {
    if (this.amount === 0) return 0;
    return (this.spent / this.amount) * 100;
  }

  /**
   * Check if budget is exceeded
   */
  isExceeded() {
    return this.spent > this.amount;
  }

  /**
   * Check if warning threshold is reached
   */
  isWarningThresholdReached() {
    return this.getSpentPercentage() >= this.warningThreshold;
  }

  /**
   * Check if budget is active for given date
   */
  isActiveForDate(date = new Date()) {
    if (!this.isActive) return false;
    
    const checkDate = new Date(date);
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    return checkDate >= start && checkDate <= end;
  }

  /**
   * Update spent amount
   */
  updateSpent(amount, operation = 'add') {
    if (operation === 'add') {
      this.spent += amount;
    } else if (operation === 'subtract') {
      this.spent = Math.max(0, this.spent - amount);
    } else if (operation === 'set') {
      this.spent = amount;
    }
    
    this.calculateRemaining();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      category: this.category,
      amount: this.amount,
      spent: this.spent,
      remaining: this.remaining,
      period: this.period,
      startDate: this.startDate,
      endDate: this.endDate,
      warningThreshold: this.warningThreshold,
      warningTriggered: this.warningTriggered,
      isActive: this.isActive,
      spentPercentage: parseFloat(this.getSpentPercentage().toFixed(2)),
      isExceeded: this.isExceeded(),
      isWarningThresholdReached: this.isWarningThresholdReached(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Validate budget data
   */
  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Category is required');
    }

    if (this.amount <= 0) {
      errors.push('Budget amount must be greater than 0');
    }

    if (this.spent < 0) {
      errors.push('Spent amount cannot be negative');
    }

    if (!['monthly', 'weekly', 'yearly'].includes(this.period)) {
      errors.push('Period must be monthly, weekly, or yearly');
    }

    if (!this.startDate || !this.endDate) {
      errors.push('Start date and end date are required');
    }

    if (this.startDate && this.endDate && new Date(this.startDate) >= new Date(this.endDate)) {
      errors.push('End date must be after start date');
    }

    if (this.warningThreshold < 0 || this.warningThreshold > 100) {
      errors.push('Warning threshold must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Budget;
