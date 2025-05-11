const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.get('/orders', protect, adminOnly, orderController.getAllOrders);
router.get('/orders/:id', protect, adminOnly, orderController.getOrderDetailsAdmin);

router.get('/orders/:id/status', protect, adminOnly, orderController.getOrderStatusHistoryAdmin);
router.put('/orders/:id/status', protect, adminOnly, orderController.updateOrderStatus);

router.get('/stats', protect, adminOnly, orderController.getOrderStats);

module.exports = router;