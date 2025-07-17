const jwt = require('jsonwebtoken');
const authServiceClient = require('../services/authServiceClient');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      data: null
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        data: null
      });
    }

    // Set user object with id from the token
    req.user = { 
      id: decoded.userId,
      email: decoded.email,
      token: token
    };
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = { 
        id: decoded.userId,
        email: decoded.email,
        token: token
      };
    }
    next();
  });
};

// Middleware for service-to-service authentication
const serviceAuth = async (req, res, next) => {
  const serviceHeader = req.headers['x-service-auth'];
  const serviceName = req.headers['x-service-name'];

  if (!serviceHeader || !serviceName) {
    return res.status(401).json({
      success: false,
      message: 'Service authentication required',
      data: null
    });
  }

  try {
    // Verify service authentication with auth service
    const authResult = await authServiceClient.validateToken(serviceHeader);
    
    if (!authResult.success || !authResult.isValid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid service authentication',
        data: null
      });
    }

    req.service = {
      name: serviceName,
      authenticated: true
    };
    next();
  } catch (error) {
    console.error('Service authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Service authentication failed',
      data: null
    });
  }
};

// Middleware to validate user context and propagate across services
const validateUserContext = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'User context required',
      data: null
    });
  }

  try {
    // Optionally validate user with auth service for additional security
    const userValidation = await authServiceClient.getUserById(req.user.id, req.user.token);
    
    if (!userValidation.success) {
      return res.status(403).json({
        success: false,
        message: 'User validation failed',
        data: null
      });
    }

    // Enhance user context with additional information
    req.user = {
      ...req.user,
      ...userValidation.user
    };
    
    next();
  } catch (error) {
    console.error('User context validation error:', error);
    next(); // Continue without additional validation if auth service is down
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  serviceAuth,
  validateUserContext
};
