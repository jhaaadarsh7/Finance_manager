const express = require('express');
const router = express.Router();

// Import route modules
const expenseRoutes = require('./expenses');
const categoryRoutes = require('./categories');

// API routes
router.use('/expenses', expenseRoutes);
router.use('/categories', categoryRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    service: 'Expense Service',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      expenses: {
        base: '/api/expenses',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage user expenses'
      },
      categories: {
        base: '/api/categories',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage expense categories'
      }
    },
    documentation: {
      expenses: {
        'GET /api/expenses': 'Get paginated list of expenses with filters',
        'POST /api/expenses': 'Create new expense',
        'GET /api/expenses/:id': 'Get expense by ID',
        'PUT /api/expenses/:id': 'Update expense',
        'DELETE /api/expenses/:id': 'Delete expense',
        'GET /api/expenses/stats': 'Get expense statistics',
        'DELETE /api/expenses/bulk': 'Bulk delete expenses'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'POST /api/categories': 'Create new category',
        'GET /api/categories/:id': 'Get category by ID',
        'PUT /api/categories/:id': 'Update category',
        'DELETE /api/categories/:id': 'Delete category',
        'GET /api/categories/stats': 'Get category usage statistics'
      }
    }
  });
});

module.exports = router;