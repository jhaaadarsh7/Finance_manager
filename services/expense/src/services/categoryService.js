const { Category, Expense } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const categoryService = {
  // Get all categories
  async getCategories(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    return await Category.findAll({
      where,
      order: [['name', 'ASC']]
    });
  },

  // Get category by ID
  async getCategoryById(id) {
    return await Category.findByPk(id);
  },

  // Create new category
  async createCategory(categoryData) {
    return await Category.create(categoryData);
  },

  // Update category
  async updateCategory(id, updateData) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      return null;
    }
    
    await category.update(updateData);
    return category;
  },

  // Soft delete category
  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      return false;
    }

    // Check if category is in use
    const expenseCount = await Expense.count({
      where: { categoryId: id }
    });

    if (expenseCount > 0) {
      // Soft delete - just mark as inactive
      await category.update({ isActive: false });
    } else {
      // Hard delete if no expenses use this category
      await category.destroy();
    }
    
    return true;
  },

  // Get category usage statistics
  async getCategoryStats(period = 'month') {
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

    // Get category usage with expense data
    const categoryStats = await Category.findAll({
      include: [{
        model: Expense,
        as: 'expenses',
        where: {
          date: {
            [Op.gte]: startDate
          }
        },
        attributes: [],
        required: false
      }],
      attributes: [
        'id',
        'name',
        'color',
        'icon',
        [sequelize.fn('COUNT', sequelize.col('expenses.id')), 'expenseCount'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('expenses.amount')), 0), 'totalAmount']
      ],
      group: ['Category.id'],
      order: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('expenses.amount')), 0), 'DESC']]
    });

    // Calculate total for percentages
    const totalAmount = categoryStats.reduce((sum, cat) => {
      return sum + parseFloat(cat.dataValues.totalAmount || 0);
    }, 0);

    return {
      period,
      startDate,
      endDate: now,
      categories: categoryStats.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        expenseCount: parseInt(category.dataValues.expenseCount || 0),
        totalAmount: parseFloat(category.dataValues.totalAmount || 0).toFixed(2),
        percentage: totalAmount > 0 ? ((category.dataValues.totalAmount / totalAmount) * 100).toFixed(1) : '0.0'
      })),
      totalAmount: totalAmount.toFixed(2)
    };
  },

  // Seed default categories
  async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: 'utensils', isDefault: true },
      { name: 'Transportation', color: '#4ECDC4', icon: 'car', isDefault: true },
      { name: 'Shopping', color: '#45B7D1', icon: 'shopping-bag', isDefault: true },
      { name: 'Entertainment', color: '#96CEB4', icon: 'film', isDefault: true },
      { name: 'Bills & Utilities', color: '#FECA57', icon: 'file-text', isDefault: true },
      { name: 'Healthcare', color: '#FF9FF3', icon: 'heart', isDefault: true },
      { name: 'Education', color: '#54A0FF', icon: 'book', isDefault: true },
      { name: 'Travel', color: '#5F27CD', icon: 'map-pin', isDefault: true },
      { name: 'Groceries', color: '#00D2D3', icon: 'shopping-cart', isDefault: true },
      { name: 'Personal Care', color: '#FF9F43', icon: 'user', isDefault: true },
      { name: 'Home & Garden', color: '#6C5CE7', icon: 'home', isDefault: true },
      { name: 'Insurance', color: '#A29BFE', icon: 'shield', isDefault: true },
      { name: 'Investments', color: '#FD79A8', icon: 'trending-up', isDefault: true },
      { name: 'Gifts & Donations', color: '#FDCB6E', icon: 'gift', isDefault: true },
      { name: 'Other', color: '#6C757D', icon: 'more-horizontal', isDefault: true }
    ];

    // Check if categories already exist
    const existingCount = await Category.count();
    
    if (existingCount === 0) {
      await Category.bulkCreate(defaultCategories);
      return defaultCategories.length;
    }
    
    return 0;
  }
};

module.exports = categoryService;