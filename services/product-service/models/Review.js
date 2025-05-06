const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow anonymous reviews
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow comments without ratings
    validate: {
      min: 1,
      max: 5,
    }
  },
  comment:{
    type:DataTypes.TEXT,
    allowNull: false
  }
});

const Product = require('./Product');

Review.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId' });

module.exports = Review;