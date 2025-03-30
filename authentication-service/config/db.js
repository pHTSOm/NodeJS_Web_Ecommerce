const {Sequelize} = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
)

const testConnection = async () => {
    try{
        await sequelize.authenticate();
        console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

const initializeDatabase = async () => {
    try{
        const User = require('../models/User');
        const Product = require('../models/Product');

        await sequelize.sync({alter:true})

        console.log("Database synchronized successfully");

        const adminCount = await User.count({where:{role:"admin"}});
        if(adminCount == 0){
            await User.create({
                email: 'admin@gmail.com',
                password: 'admin123456',
                name: 'Admin User',
                role: 'admin'
            });
            console.log('Admin user created');
        }
    } catch(error){
        console.error('Database initialization failed:', error);
    }
}

module.exports = { sequelize, testConnection, initializeDatabase};