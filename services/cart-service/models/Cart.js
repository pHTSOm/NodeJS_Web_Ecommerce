const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true  
  },
  guestId: {
    type: DataTypes.STRING,
    allowNull: true  
  },
  status: {
    type: DataTypes.ENUM('active', 'merged', 'converted', 'abandoned'),
    defaultValue: 'active'
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Carts',
  timestamps: true
});

module.exports = Cart;