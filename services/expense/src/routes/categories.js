const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { 
  createCategorySchema, 
  updateCategorySchema,
  uuidSchema
} = require('../utils/validators');

// GET /api/categories - Get all categories (public endpoint)
router.get('/', 
  optionalAuth,
  categoryController.getCategories
);

// GET /api/categories/stats - Get category statistics (requires auth)
router.get('/stats',
  authenticateToken,
  categoryController.getCategoryStats
);

// GET /api/categories/:id - Get category by ID (public endpoint)
router.get('/:id',
  validateParams(uuidSchema),
  optionalAuth,
  categoryController.getCategoryById
);

// Protected routes (require authentication)
router.use(authenticateToken);

// POST /api/categories - Create new category
router.post('/', 
  validate(createCategorySchema),
  categoryController.createCategory
);

// PUT /api/categories/:id - Update category
router.put('/:id',
  validateParams(uuidSchema),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id',
  validateParams(uuidSchema),
  categoryController.deleteCategory
);

module.exports = router;