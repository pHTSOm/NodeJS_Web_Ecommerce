// services/user-service/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.protect = async (req, res, next) => {
  try {
    console.log('Token verification starting');
    
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token ? 'YES' : 'NO');
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized - no token' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']});
      console.log('Decoded token:', decoded.id);
      
      // Get user from database and attach to request
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role', 'loyaltyPoints']
      });
      console.log('User found:', user ? 'YES' : 'NO');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Set user in request - THIS IS CRUCIAL
      req.user = user;
      console.log('User attached to request:', req.user.id, req.user.role);
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - invalid token' 
    });
  }
};

exports.adminOnly = (req, res, next) => {
  console.log('AdminOnly check - User role:', req.user?.role);
  
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - no user data' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized - admin access required' 
    });
  }
  
  next();
};