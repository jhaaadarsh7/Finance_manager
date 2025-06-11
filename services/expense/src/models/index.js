const Expense = require('./Expense');
const Category = require('./Category');

// Define associations
Category.hasMany(Expense, {
  foreignKey: 'categoryId',
  as: 'expenses'
});

Expense.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

module.exports = {
  Expense,
  Category
};