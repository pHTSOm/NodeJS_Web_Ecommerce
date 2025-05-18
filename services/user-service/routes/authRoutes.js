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
    session: false,
    prompt: 'select_account' // Force account selection prompt
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
      
      // Create frontend URL with token and user info
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
      
      // Create a cleaned version of user data
      const userData = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isNewUser: req.user.isNewUser // Pass this to the frontend
      };
      
      // Convert to JSON string and encode as base64
      const userInfo = Buffer.from(JSON.stringify(userData)).toString('base64');
      
      // Redirect to frontend auth success page with token and encoded user data
      res.redirect(`${frontendUrl}/auth/success?token=${encodeURIComponent(req.user.token)}&user=${encodeURIComponent(userInfo)}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/login?error=google_auth_failed_server_error');
    }
  }
);
  
router.get('/test-email', async (req, res) => {
  try {
    const result = await sendGoogleAuthPassword('your-test-email@example.com', 'TestPassword123');
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;