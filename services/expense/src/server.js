const express = require('express');
const cors = require('cors');
const { sequelize, initDb } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);

// Error handling
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Initialize database tables
    await initDb();
    logger.info('Database models synchronized');

    const port = process.env.PORT || 3001;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`Expense service running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start expense service:', error);
    process.exit(1);
  }
};

startServer();
