// services/user-service/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

module.exports = function() {
  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('Google auth callback triggered');
      console.log('Profile:', JSON.stringify(profile, null, 2));
      
      // Check if email is provided by Google
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email provided from Google'));
      }
      
      const email = profile.emails[0].value;
      const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      
      console.log(`Processing OAuth login for: ${email}, name: ${name}`);
      
      // Check if user exists
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log(`Creating new user for: ${email}`);
        // Create new user if doesn't exist
        user = await User.create({
          email,
          name,
          // Generate a secure random password since we won't use it
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          role: 'user'
        });
      } else {
        console.log(`Found existing user: ${user.id}`);
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return user data with token
      return done(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } catch (error) {
      console.error('Error in Google auth callback:', error);
      return done(error);
    }
  }));
};