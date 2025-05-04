
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      
    });

    // Return user data with token
    res.status(201).json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
      
    // Find user
    const user = await User.findOne({ where: { email } });
    console.log('User found:', !!user);
    if (!user) {
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    
    // Check if comparePassword method exists
    console.log('comparePassword method exists:', typeof user.comparePassword === 'function');

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password check result:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Return user data with token
    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    console.log('Headers received:', req.headers);
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token);
    }

    if (!token) {
      console.log('No token found in headers');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized - no token' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);

    req.user = await User.findByPk(decoded.id);
    console.log('User found:', req.user ? 'Yes' : 'No');
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - invalid token' 
    });
  }
};