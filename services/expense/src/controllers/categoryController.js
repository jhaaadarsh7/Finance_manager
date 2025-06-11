const categoryService = require('../services/categoryService');
const { createResponse } = require('../utils/response');

const categoryController = {
  // Get all categories
  async getCategories(req, res, next) {
    try {
      const { includeInactive } = req.query;
      const categories = await categoryService.getCategories(includeInactive === 'true');
      
      res.status(200).json(
        createResponse(true, 'Categories retrieved successfully', categories)
      );
    } catch (error) {
      next(error);
    }
  },

  // Get category by ID
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json(
          createResponse(false, 'Category not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Category retrieved successfully', category)
      );
    } catch (error) {
      next(error);
    }
  },

  // Create new category (admin only - for now just authenticated)
  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;
      const category = await categoryService.createCategory(categoryData);
      
      res.status(201).json(
        createResponse(true, 'Category created successfully', category)
      );
    } catch (error) {
      next(error);
    }
  },

  // Update category
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const category = await categoryService.updateCategory(id, updateData);
      
      if (!category) {
        return res.status(404).json(
          createResponse(false, 'Category not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Category updated successfully', category)
      );
    } catch (error) {
      next(error);
    }
  },

  // Delete category (soft delete)
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await categoryService.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json(
          createResponse(false, 'Category not found', null)
        );
      }
      
      res.status(200).json(
        createResponse(true, 'Category deleted successfully', null)
      );
    } catch (error) {
      next(error);
    }
  },

  // Get category usage statistics
  async getCategoryStats(req, res, next) {
    try {
      const { period } = req.query;
      const stats = await categoryService.getCategoryStats(period);
      
      res.status(200).json(
        createResponse(true, 'Category statistics retrieved successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;