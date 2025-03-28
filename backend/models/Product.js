const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productName:{
        type:DataTypes.STRING,
        allowNull: false
    },
    shortDesc: { 
        type: DataTypes.STRING,
        allowNull: false 
    },
    description:{
        type:DataTypes.TEXT,
        allowNull: false
    },
    price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    category:{
        type:DataTypes.STRING,
        allowNull: false
    },
    imgUrl:{
        type:DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Product;