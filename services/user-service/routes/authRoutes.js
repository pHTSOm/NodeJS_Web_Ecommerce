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
    // Create frontend URL with token and user info
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
    // Encode user info to prevent issues with special characters
    const userInfo = Buffer.from(JSON.stringify({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    })).toString('base64');
    
    // Redirect to frontend auth success page with token and encoded user data
    res.redirect(`${frontendUrl}/auth/success?token=${req.user.token}&user=${userInfo}`);
  }
);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes working!',
    googleConfig: {
      clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
      clientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/api/auth/google/callback',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost'
    }
  });
});

module.exports = router;