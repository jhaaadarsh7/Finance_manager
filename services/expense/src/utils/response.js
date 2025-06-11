/**
 * Create standardized API response
 */
const createResponse = (success, message, data = null, meta = {}) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

/**
 * Create success response
 */
const successResponse = (message, data = null, meta = {}) => {
  return createResponse(true, message, data, meta);
};

/**
 * Create error response
 */
const errorResponse = (message, data = null, meta = {}) => {
  return createResponse(false, message, data, meta);
};

/**
 * Create paginated response
 */
const paginatedResponse = (message, items, pagination) => {
  return createResponse(true, message, items, { pagination });
};

/**
 * Handle async route errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Common HTTP status codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Send success response with consistent format
 */
const sendSuccess = (res, statusCode = HTTP_STATUS.OK, message, data = null, meta = {}) => {
  return res.status(statusCode).json(successResponse(message, data, meta));
};

/**
 * Send error response with consistent format
 */
const sendError = (res, statusCode = HTTP_STATUS.BAD_REQUEST, message, data = null, meta = {}) => {
  return res.status(statusCode).json(errorResponse(message, data, meta));
};

/**
 * Send paginated response
 */
const sendPaginated = (res, message, items, pagination, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json(paginatedResponse(message, items, pagination));
};

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  paginatedResponse,
  asyncHandler,
  HTTP_STATUS,
  sendSuccess,
  sendError,
  sendPaginated
};