const { Expense, Category } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const expenseService = {
  // Create new expense
  async createExpense(expenseData) {
    const expense = await Expense.create(expenseData);
    return await this.getExpenseById(expense.id, expenseData.userId);
  },

  // Get expenses with filters and pagination
  async getExpenses(userId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const where = { userId };

    // Apply filters
    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = minAmount;
      if (maxAmount) where.amount[Op.lte] = maxAmount;
    }

    if (search) {
      where.description = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      expenses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  // Get expense by ID
  async getExpenseById(id, userId) {
    return await Expense.findOne({
      where: { id, userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }]
    });
  },

  // Update expense
  async updateExpense(id, userId, updateData) {
    const expense = await Expense.findOne({
      where: { id, userId }
    });

    if (!expense) {
      return null;
    }

    await expense.update(updateData);
    return await this.getExpenseById(id, userId);
  },

  // Delete expense
  async deleteExpense(id, userId) {
    const result = await Expense.destroy({
      where: { id, userId }
    });
    return result > 0;
  },

  // Get expense statistics
  async getExpenseStats(userId, period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Total expenses
    const totalExpenses = await Expense.sum('amount', {
      where: {
        userId,
        date: {
          [Op.gte]: startDate
        }
      }
    }) || 0;

    // Count of expenses
    const expenseCount = await Expense.count({
      where: {
        userId,
        date: {
          [Op.gte]: startDate
        }
      }
    });

    // Average expense amount
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Expenses by category
    const expensesByCategory = await Expense.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      attributes: [
        'categoryId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Expense.id')), 'count']
      ],
      group: ['categoryId', 'category.id'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    // Daily expenses for trend analysis
    const dailyExpenses = await Expense.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'date',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['date'],
      order: [['date', 'ASC']]
    });

    // Top expenses
    const topExpenses = await Expense.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      order: [['amount', 'DESC']],
      limit: 5
    });

    return {
      period,
      startDate,
      endDate: now,
      summary: {
        totalExpenses: parseFloat(totalExpenses).toFixed(2),
        expenseCount,
        averageExpense: parseFloat(averageExpense).toFixed(2)
      },
      categoryBreakdown: expensesByCategory.map(item => ({
        category: item.category,
        totalAmount: parseFloat(item.dataValues.totalAmount).toFixed(2),
        count: parseInt(item.dataValues.count),
        percentage: ((item.dataValues.totalAmount / totalExpenses) * 100).toFixed(1)
      })),
      dailyTrend: dailyExpenses.map(item => ({
        date: item.date,
        totalAmount: parseFloat(item.dataValues.totalAmount).toFixed(2),
        count: parseInt(item.dataValues.count)
      })),
      topExpenses: topExpenses.map(expense => ({
        id: expense.id,
        amount: parseFloat(expense.amount).toFixed(2),
        description: expense.description,
        date: expense.date,
        category: expense.category
      }))
    };
  },

  // Bulk delete expenses
  async bulkDeleteExpenses(userId, expenseIds) {
    const result = await Expense.destroy({
      where: {
        id: {
          [Op.in]: expenseIds
        },
        userId
      }
    });
    return result;
  },

  // Get monthly expense summary
  async getMonthlyExpenseSummary(userId, year) {
    const expenses = await Expense.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: new Date(year, 0, 1),
          [Op.lt]: new Date(year + 1, 0, 1)
        }
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'ASC']]
    });

    return expenses.map(expense => ({
      month: parseInt(expense.dataValues.month),
      totalAmount: parseFloat(expense.dataValues.totalAmount).toFixed(2),
      count: parseInt(expense.dataValues.count)
    }));
  }
};

module.exports = expenseService;