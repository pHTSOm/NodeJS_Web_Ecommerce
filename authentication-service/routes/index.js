const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const productController = require('../controllers/productController')

const {protect, adminOnly} = require('../middleware/auth')

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);

module.exports = router;