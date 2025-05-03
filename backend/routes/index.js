const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const productController = require('../controllers/productController')
const reviewController = require('../controllers/reviewController')
const orderController = require('../controllers/orderController')
const { protect, adminOnly } = require('../middleware/auth')


// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);

// Product routes - public routes
router.get('/products', productController.getAllProducts);
router.get('/products/new', productController.getNewProducts);
router.get('/products/bestseller', productController.getBestSellerProducts);
router.get('/products/brands', productController.getBrands);
router.get('/products/category/:category', productController.getProductsByCategory);
router.get('/products/:id', productController.getProductById);


// Review routes
router.get('/reviews/:productId', reviewController.getReviewsByProduct);
router.post('/reviews', reviewController.createReview);
router.delete('/reviews/:id', protect, adminOnly,reviewController.deleteReview);

// Order routes
router.post('/orders', protect, orderController.createOrder);
router.get('/orders', protect, orderController.getUserOrders);
router.get('/orders/:id', protect, orderController.getOrderDetails);
router.post('/orders/guest', orderController.getGuestOrders)

// Admin routes
//  Product management
router.post('/products', protect, adminOnly, productController.createProduct);
router.put('/products/:id', protect, adminOnly, productController.updateProduct);
router.delete('/products/:id', protect, adminOnly, productController.deleteProduct);

// Order management
router.get('/admin/orders', protect, adminOnly, orderController.getAllOrders);
router.put('/admin/orders/:id/status', protect, adminOnly, orderController.updateOrderStatus);

module.exports = router;