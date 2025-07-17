const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { validateUserContext } = require('../middleware/auth');

// Apply user context validation to all routes
router.use(validateUserContext);

// Budget CRUD routes
router.post('/', budgetController.createBudget);
router.get('/', budgetController.getUserBudgets);
router.get('/summary', budgetController.getBudgetSummary);
router.get('/sync', budgetController.syncBudgets);
router.get('/:budgetId', budgetController.getBudgetById);
router.put('/:budgetId', budgetController.updateBudget);
router.delete('/:budgetId', budgetController.deleteBudget);

module.exports = router;
