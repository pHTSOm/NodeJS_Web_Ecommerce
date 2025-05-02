const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Review = require('./Review');

// Define associations
Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'SET NULL' });
Review.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Product, Review };