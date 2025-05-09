// services/user-service/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Setup passport configuration
module.exports = () => {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists in database
      let user = await User.findOne({ 
        where: { 
          email: profile.emails[0].value 
        } 
      });
      
      // If user doesn't exist, create one
      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          // Generate a random password for OAuth users
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
          role: 'user' // Default role
        });
      }
      
      // Return user with token
      const token = generateToken(user.id);
      
      return done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token
      });
    } catch (error) {
      return done(error, null);
    }
  }));
  
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};