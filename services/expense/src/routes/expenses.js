const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { 
  createExpenseSchema, 
  updateExpenseSchema, 
  expenseQuerySchema,
  uuidSchema,
  bulkDeleteSchema
} = require('../utils/validators');

// // // Apply authentication to all routes
router.use(authenticateToken);

// GET /api/expenses/stats - Get expense statistics
router.get('/stats',
  validateQuery(expenseQuerySchema),
  expenseController.getExpenseStats
);

// GET /api/expenses - Get all expenses with filters
router.get('/', 
  validateQuery(expenseQuerySchema),
  expenseController.getExpenses
);

// POST /api/expenses - Create new expense
router.post('/', 
  validate(createExpenseSchema),
  expenseController.createExpense
);


// DELETE /api/expenses/bulk - Bulk delete expenses
router.delete('/bulk',
  validate(bulkDeleteSchema),
  expenseController.bulkDeleteExpenses
);

// GET /api/expenses/:id - Get expense by ID
router.get('/:id',
  validateParams(uuidSchema),
  expenseController.getExpenseById
);

// PUT /api/expenses/:id - Update expense
router.put('/:id',
  validateParams(uuidSchema),
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id',
  validateParams(uuidSchema),
  expenseController.deleteExpense
);

module.exports = router;