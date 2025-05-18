const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendGoogleAuthPassword } = require('../utils/emailService');

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
      
      // Check if email is provided by Google
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email provided from Google'));
      }
      
      const email = profile.emails[0].value;
      const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      
      console.log(`Processing OAuth login for: ${email}, name: ${name}`);
      
      // Check if user exists
      let user = await User.findOne({ where: { email } });
      let isNewUser = false;
      let plainPassword = ''; // Will store the plain password for email sending
      
      if (!user) {
        console.log(`Creating new user for: ${email}`);
        isNewUser = true;
        
        // Generate a secure random password
        plainPassword = Math.random().toString(36).slice(2, 10) + 
                       Math.random().toString(36).slice(2, 10) + 
                       Math.random().toString(36).slice(2, 6);
        
        // Create new user - the User model hooks will hash the password
        user = await User.create({
          email,
          name,
          password: plainPassword, // Will be hashed by the model hooks
          role: 'user'
        });
        
        // Send the plain password via email
        console.log(`Sending password email to: ${email}`);
        await sendGoogleAuthPassword(email, plainPassword);
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
        token,
        isNewUser // This can be used to show a different message to new users
      });
    } catch (error) {
      console.error('Error in Google auth callback:', error);
      return done(error);
    }
  }));
};