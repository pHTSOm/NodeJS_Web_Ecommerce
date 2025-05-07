const Review = require("../models/Review");
const Product = require("../models/Product");
const axios = require('axios');
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

// Get reviews for a product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

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
    console.error("Error getting reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  console.log("CREATE REVIEW CALLED");
  console.log("Request body:", req.body);
  console.log("User ID:", req.userId);

  const transaction = await sequelize.transaction();
  try {
    
    const { productId, rating, comment } = req.body;
    // Get user ID from token if authenticated (passed by middleware)
    let userId = req.userId;
    let finalUserName = "Guest";

    // If authenticated, fetch user name from User service (in a real micro-service architecture)
    // In this example, we'll use a placeholder
    if (userId) {
      try {
        const userServiceUrl =
          process.env.USER_SERVICE_URL || "http://user-service:3001";
        const response = await axios.get(`${userServiceUrl}/api/users/me`, {
          headers: {
            Authorization: req.headers.authorization,
          },
          timeout: 3000, // Add timeout to prevent hanging
        });

        if (response.data && response.data.user && response.data.user.name) {
          finalUserName = response.data.user.name;
        } else {
          finalUserName = `User ${userId}`;
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        // Fall back to a generic name
        finalUserName = `User ${userId}`;
      }
    }

    // Check if product exists
    const product = await Product.findByPk(productId, { transaction });
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
        userName: finalUserName,
        rating,
        comment,
      },
      { transaction }
    );

    // If rating is provided, update the product's average rating
    if (rating) {
      try {
        // Calculate new average rating
        const reviews = await Review.findAll({
          where: {
            productId,
            rating: {
              [Op.not]: null,
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
      } catch (error) {
        console.error("Error updating product rating:", error);
      }
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
      message: error.message || "Server error",
      errorDetails: error.toString()
    });
  }
};

// Delete a review (admin only)
exports.deleteReview = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const reviewId = req.params.id;

    // Check if review exists
    const review = await Review.findByPk(reviewId, { transaction });
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
          [Op.not]: null,
        },
      },
      attributes: [[sequelize.fn("AVG", sequelize.col("rating")), "avgRating"]],
      transaction,
    });

    const avgRating = reviews[0]?.dataValues?.avgRating || 0;

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
};
