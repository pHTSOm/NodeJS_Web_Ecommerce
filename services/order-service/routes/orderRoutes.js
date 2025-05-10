const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalProtect, adminOnly } = require('../middleware/auth');

// Public routes (no auth required)
router.post('/guest', orderController.getGuestOrders);

// Routes that work with or without authentication
router.post('/', optionalProtect, orderController.createOrder);
router.get('/:id', optionalProtect, orderController.getOrderDetails);
router.get('/:id/status', optionalProtect, orderController.getOrderStatusHistory);

// Routes that require authentication
router.get('/', protect, orderController.getUserOrders);

module.exports = router;