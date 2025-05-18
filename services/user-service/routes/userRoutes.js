// services/user-service/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

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

router.put("/users/:id/loyalty", protect, userController.updateLoyaltyPoints);

// Admin routes for user management
router.get("/users", protect, adminOnly, userController.getAllUsers);
router.put("/users/:id", protect, adminOnly, userController.updateUser);
router.delete("/users/:id", protect, adminOnly, userController.deleteUser);

router.get("/check-role", protect, userController.checkRole);
module.exports = router;
