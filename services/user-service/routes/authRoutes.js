// services/user-service/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const userController = require('../controllers/userController');

// Regular login/register routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Google OAuth routes
router.get('/google', 
  (req, res, next) => {
    console.log('Google auth route hit');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed',
    session: false
  }),
  (req, res) => {
    try {
      console.log('Google auth callback successful');
      console.log('User data:', {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        tokenPresent: !!req.user.token
      });
      
      // Create frontend URL with token and user info
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
      
      // Encode user info as base64 - Create a cleaned version of user data
      const userData = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      };
      
      // Convert to JSON string and encode as base64
      const userInfo = Buffer.from(JSON.stringify(userData)).toString('base64');
      
      // Log the redirected URL (with token masked)
      const redirectUrl = `${frontendUrl}/auth/success?token=${req.user.token.substring(0, 5)}...&user=${userInfo.substring(0, 10)}...`;
      console.log('Redirecting to:', redirectUrl);
      
      // Redirect to frontend auth success page with token and encoded user data
      res.redirect(`${frontendUrl}/auth/success?token=${req.user.token}&user=${userInfo}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/login?error=google_auth_failed_server_error');
    }
  }
);


module.exports = router;