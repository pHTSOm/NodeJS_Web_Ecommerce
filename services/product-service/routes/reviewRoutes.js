const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, optionalProtect, adminOnly } = require('../middleware/auth');

// Routes
router.get('/:productId', reviewController.getReviewsByProduct);
router.post('/', optionalProtect, reviewController.createReview);
router.delete('/:id', protect, adminOnly, reviewController.deleteReview);

module.exports = router;