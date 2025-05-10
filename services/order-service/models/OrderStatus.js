const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderStatus = sequelize.define('OrderStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER, // User ID of admin who made the update
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false // We only need createdAt for status history
});

module.exports = OrderStatus;