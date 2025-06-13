const Joi = require('joi');

const createExpenseSchema = Joi.object({
  categoryId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).uppercase().default('NPR'),
  description: Joi.string().max(500).optional(),
  date: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  receiptUrl: Joi.string().uri().optional(),
  isRecurring: Joi.boolean().default(false),
  recurringFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').optional()
});

const updateExpenseSchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  amount: Joi.number().positive().precision(2).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  receiptUrl: Joi.string().uri().optional(),
  isRecurring: Joi.boolean().optional(),
  recurringFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').optional()
});

const expenseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  categoryId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minAmount: Joi.number().positive().optional(),
  maxAmount: Joi.number().positive().optional(),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().valid('date', 'amount', 'description').default('date'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  period: Joi.string().valid('week', 'month', 'year').optional()
});

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).optional(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#3B82F6'),
  icon: Joi.string().max(50).default('shopping-cart'),
  isDefault: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(500).optional(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  icon: Joi.string().max(50).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

const uuidSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const bulkDeleteSchema = Joi.object({
  expenseIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  uuidSchema,
  bulkDeleteSchema
};