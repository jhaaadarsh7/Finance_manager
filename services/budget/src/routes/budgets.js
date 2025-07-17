const express = require('express');
const BudgetController = require('../controllers/budgetController');
const router = express.Router();

router.post('/', BudgetController.create);
router.get('/:id', BudgetController.getById);
router.put('/:id', BudgetController.update);
router.delete('/:id', BudgetController.delete);
router.get('/user/:user_id', BudgetController.listForUser);

module.exports = router;