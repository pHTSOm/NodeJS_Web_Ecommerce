const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { testConnection, initializeDatabase } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Static files middleware for product images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Product service is healthy');
});

// Add this route to test connectivity
app.get('/api/system/test-user-service', async (req, res) => {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:3001";
    const response = await axios.get(`${userServiceUrl}/health`, {
      timeout: 3000
    });
    
    res.json({
      success: true,
      message: "Connection to user service successful",
      response: response.data
    });
  } catch (error) {
    console.error("Error connecting to user service:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to connect to user service",
      error: error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Product service running on port ${PORT}`);
  
  try {
    await testConnection();
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
});