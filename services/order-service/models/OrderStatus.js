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
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    allowNull: false
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = OrderStatus;