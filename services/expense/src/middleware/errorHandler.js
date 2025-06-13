const logger = require('../utils/logger');
const { createResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Log full stack with context for easier debugging
  logger.error(`Error on ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Also print to console as fallback
  console.error(`Error on ${req.method} ${req.originalUrl}`, err.stack || err);

  // Handle known Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json(createResponse(false, 'Validation error', { errors }));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(createResponse(false, 'Resource already exists', null));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json(createResponse(false, 'Invalid reference to related resource', null));
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json(createResponse(false, 'Database connection error', null));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(createResponse(false, 'Invalid token', null));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(createResponse(false, 'Token expired', null));
  }

  // Custom app errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json(createResponse(false, err.message, null));
  }

  // For unhandled errors:
  // In development, optionally send stack trace in response
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json(createResponse(false, 'Internal server error', { error: err.message, stack: err.stack }));
  }

  // Production: don't leak error details
  return res.status(500).json(createResponse(false, 'Internal server error', null));
};

module.exports = errorHandler;
