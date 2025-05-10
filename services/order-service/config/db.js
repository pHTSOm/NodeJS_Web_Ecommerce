const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    // Import models first to ensure they're defined
    const Order = require('../models/Order');
    const OrderItem = require('../models/OrderItem');
    const OrderStatus = require('../models/OrderStatus');
    
    // Define relationships
    Order.hasMany(OrderItem, { 
      foreignKey: 'orderId', 
      onDelete: 'CASCADE'
    });
    OrderItem.belongsTo(Order, { 
      foreignKey: 'orderId'
    });
    
    Order.hasMany(OrderStatus, { 
      foreignKey: 'orderId', 
      onDelete: 'CASCADE'
    });
    OrderStatus.belongsTo(Order, { 
      foreignKey: 'orderId'
    });

    // Sync with database
    await sequelize.sync({ alter: true });
    console.log('Database models synced successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection, initializeDatabase };