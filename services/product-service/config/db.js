// product-service/config/db.js
const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

const initializeDatabase = async () => {
  try {
    // Import models relevant to this service
    const Product = require("../models/Product");
    const ProductVariant = require("../models/ProductVariant");
    const Review = require("../models/Review");

    // Define associations for this service
    Product.hasMany(ProductVariant, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    ProductVariant.belongsTo(Product, { foreignKey: "productId" });

    Product.hasMany(Review, { foreignKey: "productId", onDelete: "CASCADE" });
    Review.belongsTo(Product, { foreignKey: "productId" });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created directory: ${uploadsDir}`);
    }

    // Sync models with the database
    await sequelize.sync({ alter: true });
    
    console.log("Product service models synced with database");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

module.exports = { sequelize, testConnection, initializeDatabase };