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
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    // Create and send JWT token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${req.user.token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }))}`);
  }
);

module.exports = router;