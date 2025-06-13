const expenseService = require('../services/expenseService');
const { createResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { Expense } = require('../models');




const expenseController = {
  // Create new expense
  async createExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const expenseData = { ...req.body, userId };
      
      const expense = await expenseService.createExpense(expenseData);
      
      res.status(201).json(
        createResponse(true, 'Expense created successfully', expense)
      );
    } catch (error) {
      next(error);
    }
  },

  // Get all expenses for user
  async getExpenses(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.query;
      
      const result = await expenseService.getExpenses(userId, filters);
      
      res.status(200).json(
        createResponse(true, 'Expenses retrieved successfully', result)
      );
    } catch (error) {
     logger.error('Failed to get expenses', { error });

   next(error);
    }
  },


  
  // Get expense by ID
  async getExpenseById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const expense = await expenseService.getExpenseById(id, userId);
      
      if (!expense) {
        return res.status(404).json(
          createResponse(false, 'Expense not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Expense retrieved successfully', expense)
      );
    } catch (error) {
      next(error);
    }
  },

  // Update expense
  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;
      
      const expense = await expenseService.updateExpense(id, userId, updateData);
      
      if (!expense) {
        return res.status(404).json(
          createResponse(false, 'Expense not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Expense updated successfully', expense)
      );
    } catch (error) {
      next(error);
    }
  },

  // Delete expense
  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await expenseService.deleteExpense(id, userId);
      
      if (!deleted) {
        return res.status(404).json(
          createResponse(false, 'Expense not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Expense deleted successfully', null)
      );
    } catch (error) {
      next(error);
    }
  },

  // Get expense statistics
  async getExpenseStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { period } = req.query;
      
      const stats = await expenseService.getExpenseStats(userId, period);
      
      res.status(200).json(
        createResponse(true, 'Expense statistics retrieved successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  },

  // Bulk delete expenses
  async bulkDeleteExpenses(req, res, next) {
    try {
      const userId = req.user.id;
      const { expenseIds } = req.body;
      
      const deletedCount = await expenseService.bulkDeleteExpenses(userId, expenseIds);
      
      res.status(200).json(
        createResponse(true, `${deletedCount} expenses deleted successfully`, { deletedCount })
      );
    } catch (error) {
      next(error);
    }
  }
};

module.exports = expenseController;