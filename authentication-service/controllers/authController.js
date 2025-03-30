
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { redisClient, connectRedis } = require('../utils/redis');

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
      // Default role is 'user' as defined in the model
    });

    // Connect to Redis and publish event
    try {
      await connectRedis();
      await redisClient.publish('user:registered', JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name
      }));
      console.log(`Published user:registered event for ${email}`);
    } catch (redisError) {
      // Don't fail the registration if Redis fails
      console.error('Redis error during registration:', redisError);
    }

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