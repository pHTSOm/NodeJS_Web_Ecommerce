const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const productController = require('../controllers/productController')

const {protect, adminOnly} = require('../middleware/auth')

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);

// Product routes - public routes
router.get('/products/category/:category', productController.getProductsByCategory);
router.get('/products/:id', productController.getProductById);
router.get('/products', productController.getAllProducts);

//  Product routes - admin only routes
router.post('/products', protect, adminOnly, productController.createProduct);
router.put('/products/:id', protect, adminOnly, productController.updateProduct);
router.delete('/products/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;