// services/user-service/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

// IMPORTANT: Put check-role BEFORE the /:id route to avoid conflicts
router.get("/check-role", protect, userController.checkRole);

// Auth routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", protect, userController.getMe);

// Profile management routes
router.put("/profile", protect, userController.updateProfile);
router.put("/change-password", protect, userController.changePassword);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

// Address routes
router.post("/addresses", protect, userController.addAddress);
router.get("/addresses", protect, userController.getAddresses);
router.put("/addresses/:id", protect, userController.updateAddress);
router.delete("/addresses/:id", protect, userController.deleteAddress);

// Individual user routes (PUT THIS AFTER check-role)
router.get('/:id', protect, userController.getUserById); 
router.put("/:id/loyalty", protect, userController.updateLoyaltyPoints);

// Admin routes for user management - FIXED: Changed route paths
router.get("/admin/all", protect, adminOnly, userController.getAllUsers);
router.put("/admin/:id", protect, adminOnly, userController.updateUser);
router.delete("/admin/:id", protect, adminOnly, userController.deleteUser);

module.exports = router;