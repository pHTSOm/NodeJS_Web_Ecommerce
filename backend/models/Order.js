const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow anonymous orders
    },
    guestEmail:{
        type: DataTypes.STRING,
        allowNull: true, // Allow anonymous orders
        validate: {
            isEmail: true,
        }
    },
    orderNumber:{
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    totalAmount:{
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,   
    },
    totalItems:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status:{
        type: DataTypes.ENUM('pending', 'processing',  'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending',
    },
    // Shipping information
    shippingName:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    shippingAddress:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    shippingCity:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    shippingState:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    shippingZip: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    shippingCountry:{
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Vietnam'
    },
    contactPhone:{
        type: DataTypes.STRING,
        allowNull: false
    },
    contactPhone:{
        type: DataTypes.STRING,
        allowNull: false
    },
    contactEmail:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        }
    },
    paymentMethod:{
        type: DataTypes.STRING,
        defaultValue: 'COD/Cash on Delivery',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
});

// Create associations
const User = require('./User')

// Associate with User if available
Order.belongsTo(User, { foreignKey: 'userId', constraints: false });
User.hasMany(Order, { foreignKey: 'userId', constraints: false });

module.exports = Order;