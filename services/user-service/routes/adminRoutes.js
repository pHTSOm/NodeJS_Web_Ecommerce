// services/user-service/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Admin user management routes
router.get("/users", userController.getAllUsers);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;