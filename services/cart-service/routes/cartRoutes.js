const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect, optionalProtect } = require('../middleware/auth');

router.get('/', optionalProtect, cartController.getCart);
router.post('/items', optionalProtect, cartController.addItem);
router.put('/items/:itemId', optionalProtect, cartController.updateItemQuantity);
router.delete('/items/:itemId', optionalProtect, cartController.removeItem);
router.delete('/clear', optionalProtect, cartController.clearCart);

router.post('/associate', protect, cartController.associateCart);
module.exports = router;