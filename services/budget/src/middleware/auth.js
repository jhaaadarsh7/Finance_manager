const jwt = require('jsonwebtoken');
const authServiceClient = require('../services/authServiceClient');

// Response helper
const createResponse = (success, message, data = null) => ({
  success,
  message,
  data,
  timestamp: new Date().toISOString()
});

// Main JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(
      createResponse(false, 'Access token is required', null)
    );
  }

  try {
    // First, try to verify the token locally
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optionally validate with auth service for extra security
    if (process.env.VALIDATE_WITH_AUTH_SERVICE === 'true') {
      const validation = await authServiceClient.validateToken(token);
      if (!validation.valid) {
        return res.status(403).json(
          createResponse(false, 'Token validation failed with auth service', null)
        );
      }
    }

    // Set user object with id from the token
    req.user = { 
      id: decoded.userId,
      token: token
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        createResponse(false, 'Token has expired', null)
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json(
        createResponse(false, 'Invalid token', null)
      );
    }
    
    return res.status(403).json(
      createResponse(false, 'Token verification failed', null)
    );
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      id: decoded.userId,
      token: token
    };
  } catch (error) {
    // For optional auth, we don't fail - just proceed without user
    req.user = null;
  }
  
  next();
};

// Service-to-service authentication
const serviceAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  const expectedKey = process.env.SERVICE_AUTH_KEY;
  
  if (!serviceKey || !expectedKey) {
    return res.status(401).json(
      createResponse(false, 'Service authentication required', null)
    );
  }
  
  if (serviceKey !== expectedKey) {
    return res.status(403).json(
      createResponse(false, 'Invalid service key', null)
    );
  }
  
  req.isServiceRequest = true;
  next();
};

// Admin authentication (for admin-only endpoints)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(
      createResponse(false, 'Authentication required', null)
    );
  }
  
  // For now, we'll add admin logic later when we have user roles
  // This is a placeholder for future admin functionality
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  serviceAuth,
  requireAdmin,
  createResponse
};