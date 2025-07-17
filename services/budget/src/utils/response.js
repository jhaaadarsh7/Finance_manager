/**
 * Create standardized API response
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response object
 */
const createResponse = (success, message, data = null, meta = {}) => {
  return {
    success,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      service: 'budget-service',
      ...meta
    }
  };
};

/**
 * Create success response
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Success response
 */
const successResponse = (message, data = null, meta = {}) => {
  return createResponse(true, message, data, meta);
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {*} data - Error data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Error response
 */
const errorResponse = (message, data = null, meta = {}) => {
  return createResponse(false, message, data, meta);
};

/**
 * Create paginated response
 * @param {Array} items - Array of items
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 * @returns {Object} Paginated response
 */
const paginatedResponse = (items, total, page, limit, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse(message, items, {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  });
};

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  paginatedResponse
};
