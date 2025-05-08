const jwt = require('jsonwebtoken');

exports.optionalProtect = async (req, res, next) => {
  try {
    console.log('optionalProtect middleware called');
    console.log('Headers:', {
      auth: req.headers.authorization ? 'Present' : 'Not present',
      cookies: req.headers.cookie ? 'Present' : 'Not present'
    });
    
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log('Token extracted from Authorization header');

      try {
        // Ensure JWT_SECRET is properly configured
        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET not set in environment variables');
          req.userId = null;
        } else {
          // Attempt to verify token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.userId = decoded.id;
          console.log('Token verified successfully, userId:', req.userId);
        }
      } catch (error) {
        console.log('Token verification failed:', error.message);
        req.userId = null;
      }
    } else {
      console.log('No Authorization header found');
      req.userId = null;
    }
    
    // Log guest cart cookie
    if (req.cookies && req.cookies['guest_cart_id']) {
      console.log('Guest cart cookie found:', req.cookies['guest_cart_id'].substring(0, 8) + '...');
    } else {
      console.log('No guest cart cookie found');
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
    console.log('protect middleware called');
    
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from Authorization header');
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if JWT_SECRET is properly set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      console.log('Token verified successfully, userId:', req.userId);
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        details: error.message
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