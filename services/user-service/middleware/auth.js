const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.protect = async (req, res, next) => {
  try {
    // Add some debug logs
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']});
    console.log('Decoded token:', decoded.id);
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - invalid token' 
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Not authorized - admin access required' 
    });
  }
};