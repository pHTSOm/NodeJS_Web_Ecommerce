const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    
    console.log('=== OPTIONAL PROTECT MIDDLEWARE ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findByPk(decoded.id);
        console.log('Token valid - User found:', !!req.user);
      } catch (error) {
        // Invalid token, continue without user
        console.log('Invalid token, continuing as guest:', error.message);
        req.user = null;
      }
    } else {
      console.log('No token provided - guest access');
    }
    
    next();
  } catch (error) {
    console.error('Error in optionalProtect middleware:', error);
    next(); // Continue without throwing error
  }
};