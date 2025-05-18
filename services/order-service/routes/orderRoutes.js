const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middleware/auth');

// Customer routes
router.post('/', optionalProtect, orderController.createOrder);
router.get('/', protect, orderController.getUserOrders);
router.get('/:id', protect, orderController.getOrderDetails);
router.get('/:id/status', protect, orderController.getOrderStatusHistory);
router.post('/guest', orderController.trackGuestOrder);

module.exports = router;