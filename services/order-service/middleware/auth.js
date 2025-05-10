const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
      } catch (error) {
        console.log('Token verification failed:', error.message);
        req.userId = null;
      }
    } else {
      req.userId = null;
    }
    
    next();
  } catch (error) {
    console.error("Error in optionalProtect middleware:", error);
    req.userId = null;
    next();
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Error in protect middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token'
      });
    }

    // Check with user service if user is admin
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';

    try {
      const response = await axios.get(
        `${userServiceUrl}/api/users/check-role`,
        {
          headers: {
            Authorization: req.headers.authorization
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.role === 'admin') {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized - admin access required'
        });
      }
    } catch (error) {
      console.error('Admin check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication service unavailable'
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};