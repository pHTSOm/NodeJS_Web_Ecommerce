const Review = require("../models/Review");
const Product = require("../models/Product");
const { sequelize } = require("../config/db");

// Get reviews for a product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`Fetching reviews for product ID: ${productId}`);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch reviews with count
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { productId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      reviews,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Detailed error in getReviewsByProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
// Create a new review
exports.createReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productId, userName, rating, comment } = req.body;
    const userId = req.user ? req.user.id : null;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // If rating is provided, the user must be authenticated
    if (rating !== undefined && rating !== null) {
      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "You must be logged in to rate a product",
        });
      }
    }
    
    // Create the review
    const review = await Review.create(
      {
        productId,
        userId,
        userName,
        rating,
        comment,
      },
      { transaction }
    );

    // If rating is provided, update the product's average rating
    if (rating) {
      // Calculate new average rating
      const reviews = await Review.findAll({
        where: {
          productId,
          rating: {
            [sequelize.Op.not]: null,
          },
        },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
        ],
        transaction,
      });

      const avgRating = reviews[0].dataValues.avgRating || 0;

      // Update product's average rating
      await Product.update(
        { avgRating },
        {
          where: { id: productId },
          transaction,
        }
      );
    }

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();

    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a review (admin only)
exports.deleteReview = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const reviewId = req.params.reviewId;

        // check if review exists
        const review = await Review.findByPk(reviewId);
        if (!review) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Delete the review
        await review.destroy({ transaction });

        // Recalculate the product's average rating
        const productId = review.productId;
        const reviews = await Review.findAll({
            where: {
                productId,
                rating: {
                    [sequelize.Op.not]: null,
                },
            },
            attributes: [
                [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
            ],
            transaction,
        });

        const avgRating = reviews[0].dataValues.avgRating || 0;

        // Update product's average rating
        await Product.update(
            { avgRating },
            {
                where: { id: productId },
                transaction,
            }
        );

        // Commit the transaction
        await transaction.commit();
        res.json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();

        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}