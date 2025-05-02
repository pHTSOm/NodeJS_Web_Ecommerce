const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductVariant = sequelize.define('ProductVariant', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productId:{
        type:DataTypes.INTEGER,
        allowNull: false
    },
    name:{
        type:DataTypes.STRING,
        allowNull: false
    },
    description:{
        type:DataTypes.STRING,
        allowNull: false
    },
    additionalPrice:{
        type:DataTypes.DECIMAL(10,2),
        defaultValue: 0
    },
    stock:{
        type:DataTypes.INTEGER,
        defaultValue: 0
    },
    sku:{
        type:DataTypes.DECIMAL(10,2),
        allowNull: false
    }
});

const Product = require('./Product');
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(ProductVariant, { foreignKey: 'productId' });

module.exports = ProductVariant; 
    