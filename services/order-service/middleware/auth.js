// services/order-service/middleware/auth.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.optionalProtect = async (req, res, next) => {
  try {
    console.log('[optionalProtect] Checking authentication...');
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[optionalProtect] Token found in headers');
    }
    
    if (!token) {
      // No token provided - proceed as guest
      console.log('[optionalProtect] No token found, proceeding as guest');
      req.userId = null;
      req.userRole = null;
      return next();
    }
    
    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('[optionalProtect] Missing JWT_SECRET environment variable');
        req.userId = null;
        req.userRole = null;
        return next();
      }
      
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.id;
      console.log(`[optionalProtect] Valid token, user ID: ${req.userId}`);
      
      // Try to get user role from user service
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
        const response = await axios.get(`${userServiceUrl}/api/users/check-role`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
        
        if (response.data && response.data.success) {
          req.userRole = response.data.role;
          console.log(`[optionalProtect] User role: ${req.userRole}`);
        }
      } catch (roleError) {
        console.error('[optionalProtect] Error checking user role:', roleError.message);
        // Continue without role information
      }
      
      next();
    } catch (error) {
      // Invalid token but continue without authentication
      console.error('[optionalProtect] Token verification failed:', error.message);
      req.userId = null;
      req.userRole = null;
      next();
    }
  } catch (error) {
    console.error('[optionalProtect] Error in middleware:', error);
    req.userId = null;
    req.userRole = null;
    next();
  }
};

exports.protect = async (req, res, next) => {
  try {
    console.log('[protect] Checking authentication...');
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[protect] Token found in headers');
    }
    
    if (!token) {
      console.log('[protect] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token'
      });
    }
    
    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('[protect] Missing JWT_SECRET environment variable');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }
      
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.id;
      console.log(`[protect] Valid token, user ID: ${req.userId}`);
      
      // Try to get user role from user service
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
        const response = await axios.get(`${userServiceUrl}/api/users/check-role`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
        
        if (response.data && response.data.success) {
          req.userRole = response.data.role;
          console.log(`[protect] User role: ${req.userRole}`);
        }
      } catch (roleError) {
        console.error('[protect] Error checking user role:', roleError.message);
        // Continue without role information
      }
      
      next();
    } catch (error) {
      console.error('[protect] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized - invalid token'
      });
    }
  } catch (error) {
    console.error('[protect] Error in middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.adminOnly = async (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - admin only'
    });
  }
  
  next();
};