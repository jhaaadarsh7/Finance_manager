const jwt = require('jsonwebtoken');
const { createResponse } = require('../utils/response');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(
      createResponse(false, 'Access token is required', null)
    );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json(
        createResponse(false, 'Invalid or expired token', null)
      );
    }

    // Set user object with id from the token
    req.user = { id: decoded.userId };
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
      req.user = { id: decoded.userId };
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};