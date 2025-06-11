const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Expense = sequelize.define("Expense", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "user_id",
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "category_id",
    references: {
      model: "categories",
      key: "id",
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
      isDecimal: true,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: "NPR",
    validate: {
      len: [3, 3],
      isAlpha: true,
      isUppercase: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  tags: {
    type: DataTypes.JSON, // ✅ Corrected type
    allowNull: true,
    defaultValue: [],
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "receipt_url",
    validate: {
      isUrl: true,
    },
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "is_recurring",
  },
  recurringFrequency: {
    type: DataTypes.ENUM("daily", "weekly", "monthly", "yearly"), // ✅ Fixed type usage
    allowNull: true,
    field: "recurring_frequency",
  },
}, {
  tableName: "expenses",
  indexes: [
    { fields: ["user_id"] },
    { fields: ["category_id"] },
    { fields: ["date"] },
    { fields: ["user_id", "date"] },
  ],
});

module.exports = Expense;
