// services/cart-service/config/db.js
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
    // Add these options to help prevent deadlocks
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
    // Import models first to ensure they're defined
    const Cart = require('../models/Cart');
    const CartItem = require('../models/CartItem');
    
    // Define relationships AFTER importing all models
    // This is critical to avoid circular dependencies
    Cart.hasMany(CartItem, { 
      foreignKey: 'cartId', 
      as: 'cartItems', 
      onDelete: 'CASCADE'
    });
    CartItem.belongsTo(Cart, { 
      foreignKey: 'cartId'
    });

    // Use force: false and alter: true for safer sync
    // Try with a retry mechanism
    let syncAttempts = 0;
    const maxSyncAttempts = 3;
    
    while (syncAttempts < maxSyncAttempts) {
      try {
        await sequelize.sync({ alter: true, force: false });
        console.log('Database models synced successfully');
        return true;
      } catch (error) {
        syncAttempts++;
        console.error(`Database sync attempt ${syncAttempts} failed:`, error.message);
        
        if (syncAttempts === maxSyncAttempts) {
          console.error('All sync attempts failed. Last error:', error);
          // Instead of failing completely, we can try a simpler sync without altering
          try {
            console.log('Attempting simple sync without altering tables...');
            await sequelize.sync({ alter: false, force: false });
            console.log('Simple sync succeeded. Some schema changes may not have been applied.');
            return true;
          } catch (simpleError) {
            console.error('Simple sync also failed:', simpleError);
            return false;
          }
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection, initializeDatabase };