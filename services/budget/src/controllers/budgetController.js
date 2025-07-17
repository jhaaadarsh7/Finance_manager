const Budget = require('../models/Budget');
const BudgetEventPublisher = require('../events/budgetEventPublisher');
const budgetSyncService = require('../services/budgetSyncService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class BudgetController {
  /**
   * Create a new budget
   */
  async createBudget(req, res) {
    try {
      const { category, amount, period, startDate, endDate, warningThreshold } = req.body;
      const userId = req.user.id;

      // Create budget instance
      const budgetData = {
        userId,
        category,
        amount,
        period,
        startDate,
        endDate,
        warningThreshold,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Auto-calculate dates if not provided
      if (!startDate || !endDate) {
        const calculatedPeriod = budgetSyncService.calculateBudgetPeriod(period);
        budgetData.startDate = budgetData.startDate || calculatedPeriod.startDate;
        budgetData.endDate = budgetData.endDate || calculatedPeriod.endDate;
      }

      const budget = new Budget(budgetData);

      // Validate budget data
      const validation = budget.validate();
      if (!validation.isValid) {
        return res.status(400).json(errorResponse(
          'Validation failed',
          { errors: validation.errors }
        ));
      }

      // TODO: Save to database
      // For now, we'll simulate a saved budget with an ID
      budget.id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Sync with existing expenses
      await budgetSyncService.syncBudgetWithExpenses(budget, req.user.token);

      // Publish budget created event
      await BudgetEventPublisher.publishCreated(budget);

      res.status(201).json(successResponse(
        'Budget created successfully',
        budget.toJSON()
      ));

    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json(errorResponse(
        'Failed to create budget',
        { error: error.message }
      ));
    }
  }

  /**
   * Get user budgets
   */
  async getUserBudgets(req, res) {
    try {
      const userId = req.user.id;
      const { 
        category, 
        period, 
        active,
        page = 1, 
        limit = 10 
      } = req.query;

      // TODO: Fetch from database with filters
      // For now, return mock data
      const budgets = [];
      const total = 0;

      res.json(paginatedResponse(
        budgets,
        total,
        parseInt(page),
        parseInt(limit),
        'Budgets retrieved successfully'
      ));

    } catch (error) {
      console.error('Error fetching user budgets:', error);
      res.status(500).json(errorResponse(
        'Failed to fetch budgets',
        { error: error.message }
      ));
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(req, res) {
    try {
      const { budgetId } = req.params;
      const userId = req.user.id;

      // TODO: Fetch from database
      // Verify budget belongs to user
      
      res.status(404).json(errorResponse(
        'Budget not found',
        { budgetId }
      ));

    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json(errorResponse(
        'Failed to fetch budget',
        { error: error.message }
      ));
    }
  }

  /**
   * Update budget
   */
  async updateBudget(req, res) {
    try {
      const { budgetId } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // TODO: Fetch existing budget from database
      // Verify budget belongs to user
      
      // Create updated budget instance
      const updatedBudget = new Budget({
        id: budgetId,
        userId,
        updatedAt: new Date().toISOString(),
        ...updates
      });

      // Validate updated data
      const validation = updatedBudget.validate();
      if (!validation.isValid) {
        return res.status(400).json(errorResponse(
          'Validation failed',
          { errors: validation.errors }
        ));
      }

      // TODO: Save to database

      // Publish budget updated event
      await BudgetEventPublisher.publishUpdated(updatedBudget);

      res.json(successResponse(
        'Budget updated successfully',
        updatedBudget.toJSON()
      ));

    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json(errorResponse(
        'Failed to update budget',
        { error: error.message }
      ));
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(req, res) {
    try {
      const { budgetId } = req.params;
      const userId = req.user.id;

      // TODO: Fetch and verify budget exists and belongs to user
      // TODO: Delete from database

      // Publish budget deleted event
      await BudgetEventPublisher.publishDeleted(budgetId, userId);

      res.json(successResponse(
        'Budget deleted successfully',
        { budgetId }
      ));

    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json(errorResponse(
        'Failed to delete budget',
        { error: error.message }
      ));
    }
  }

  /**
   * Get budget summary for user
   */
  async getBudgetSummary(req, res) {
    try {
      const userId = req.user.id;
      const { period } = req.query;

      // TODO: Generate comprehensive budget summary
      const summary = {
        totalBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        budgetsExceeded: 0,
        budgetsAtWarning: 0,
        categoryBreakdown: [],
        spentPercentage: 0
      };

      res.json(successResponse(
        'Budget summary retrieved successfully',
        summary
      ));

    } catch (error) {
      console.error('Error generating budget summary:', error);
      res.status(500).json(errorResponse(
        'Failed to generate budget summary',
        { error: error.message }
      ));
    }
  }

  /**
   * Sync user budgets with expenses
   */
  async syncBudgets(req, res) {
    try {
      const userId = req.user.id;

      await budgetSyncService.syncUserBudgets(userId, req.user.token);

      res.json(successResponse(
        'Budget sync completed successfully'
      ));

    } catch (error) {
      console.error('Error syncing budgets:', error);
      res.status(500).json(errorResponse(
        'Failed to sync budgets',
        { error: error.message }
      ));
    }
  }
}

module.exports = new BudgetController();
