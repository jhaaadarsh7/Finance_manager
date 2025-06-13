const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false
    },
    dialectOptions: {
      charset: 'utf8mb4'
    }
  }
);

// Initialize database tables
const initDb = async () => {
  try {
    // Import models here to avoid circular dependency
    const Expense = require('../models/Expense');
    const Category = require('../models/Category');

    // Set up associations
    Expense.belongsTo(Category, { foreignKey: 'categoryId' });
    Category.hasMany(Expense, { foreignKey: 'categoryId' });

    // Sync without force to preserve data
    await sequelize.sync();
    logger.info('Expense database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing expense database:', error);
    throw error;
  }
};

module.exports = { sequelize, initDb };