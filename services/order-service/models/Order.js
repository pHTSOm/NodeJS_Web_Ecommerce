const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true // Allow guest orders (null userId)
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  discountCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  loyaltyPointsUsed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  loyaltyPointsEarned: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestAccountCreated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Order;