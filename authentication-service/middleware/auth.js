const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - verifies JWT token
exports.protect = async (req,res,next) =>{
    try{
        let token;
        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        }

        if(!token){
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized - no token' 
              });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findByPk(decoded.id);
        next();
    }catch (error){
        console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - invalid token' 
        });
    }
};

exports.adminOnly = (req,res,next) => {
    if(req.user && req.user.role == "admin"){
        next();
    }else{
        res.status(403).json({ 
            success: false, 
            message: 'Not authorized - admin access required' 
          });
    }
}

// Generate JWT token
exports.generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  };