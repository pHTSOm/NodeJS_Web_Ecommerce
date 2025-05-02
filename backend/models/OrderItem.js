const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    productName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    variantName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    unitPrice:{
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalPrice:{
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
});

// Create association
const Order = require('./Order')
const Product = require ('./Product')
const ProductVariant = require('./ProductVariant')

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

OrderItem.belongsTo(Product, { foreignKey: 'productId' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variantId', constraints: false});

module.exports = OrderItem;