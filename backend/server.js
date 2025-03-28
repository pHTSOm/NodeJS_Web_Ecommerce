const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const { testConnection, initializeDatabase} = require('./config/db');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Initialize database
(async () => {
    await testConnection();
    await initializeDatabase();
})();

app.use('/api', routes)

app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});