// services/order-service/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection, initializeDatabase } = require('./config/db');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.SERVICE_PORT || 3005;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Log headers but filter out sensitive information
  const filteredHeaders = Object.keys(req.headers).reduce((acc, key) => {
    if (key !== 'authorization') {
      acc[key] = req.headers[key];
    } else {
      acc[key] = 'Bearer [FILTERED]';
    }
    return acc;
  }, {});
  
  console.log('Headers:', filteredHeaders);
  
  if (req.body && Object.keys(req.body).length > 0) {
    // Log request body but filter out sensitive information
    const filteredBody = { ...req.body };
    if (filteredBody.shipping && filteredBody.shipping.email) {
      // Keep email structure but hide actual value
      filteredBody.shipping.email = `***@${filteredBody.shipping.email.split('@')[1]}`;
    }
    console.log('Body:', JSON.stringify(filteredBody));
  }
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost', 'http://localhost:80', 'http://frontend:80'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Import middleware
const { optionalProtect, protect, adminOnly } = require('./middleware/auth');

// Import routes
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routes
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Order service is healthy',
    env: {
      DB_HOST: process.env.DB_HOST || 'not set',
      DB_NAME: process.env.DB_NAME || 'not set',
      USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'not set',
      PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'not set',
      SERVICE_PORT: process.env.SERVICE_PORT || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Stack trace:', err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database, but server will still start');
    }
    
    // Initialize database
    const initialized = await initializeDatabase();
    if (!initialized) {
      console.error('Failed to initialize database, but server will still start');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DB_HOST: process.env.DB_HOST || 'not set',
        DB_NAME: process.env.DB_NAME || 'not set',
        USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'not set',
        PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'not set',
        SERVICE_PORT: process.env.SERVICE_PORT || 'not set'
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();