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
    },
    retry: {
      match: [/Deadlock/i, /ER_LOCK_DEADLOCK/],
      max: 3
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
    // Import models
    const Order = require('../models/Order');
    const OrderItem = require('../models/OrderItem');
    const OrderStatus = require('../models/OrderStatus');
    
    // Define associations
    Order.hasMany(OrderItem, { 
      foreignKey: 'orderId', 
      as: 'OrderItems',
      onDelete: 'CASCADE' 
    });
    OrderItem.belongsTo(Order, { 
      foreignKey: 'orderId' 
    });
    
    Order.hasMany(OrderStatus, { 
      foreignKey: 'orderId', 
      as: 'StatusHistory',
      onDelete: 'CASCADE' 
    });
    OrderStatus.belongsTo(Order, { 
      foreignKey: 'orderId' 
    });
    
    // Sync with database (with retry mechanism)
    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully');
        return true;
      } catch (error) {
        retries++;
        console.error(`Database sync failed (attempt ${retries}/${maxRetries}):`, error.message);
        
        if (retries === maxRetries) {
          console.error('All sync attempts failed, trying simpler sync without alter');
          try {
            await sequelize.sync();
            console.log('Simple database sync successful');
            return true;
          } catch (simpleError) {
            console.error('Simple sync also failed:', simpleError);
            return false;
          }
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection, initializeDatabase };