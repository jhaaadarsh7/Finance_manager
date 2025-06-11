const logger = require('../utils/logger');
const { createResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => error.message);
    return res.status(400).json(
      createResponse(false, 'Validation error', { errors })
    );
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(
      createResponse(false, 'Resource already exists', null)
    );
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json(
      createResponse(false, 'Invalid reference to related resource', null)
    );
  }

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json(
      createResponse(false, 'Database connection error', null)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      createResponse(false, 'Invalid token', null)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      createResponse(false, 'Token expired', null)
    );
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json(
      createResponse(false, err.message, null)
    );
  }

  // Default server error
  res.status(500).json(
    createResponse(false, 'Internal server error', null)
  );
};

module.exports = errorHandler;