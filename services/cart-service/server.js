const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection, initializeDatabase } = require('./config/db');

const app = express();
const PORT = process.env.SERVICE_PORT || 3003;

// Add more detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.headers.authorization) {
    console.log('Authorization header present');
  }
  if (req.headers.cookie) {
    console.log('Cookie header present');
  }
  next();
});

// Middleware - order matters!
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: ['http://localhost', 'http://localhost:80', 'http://frontend:80'],
  credentials: true, // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).send('Cart service is healthy');
});

app.get('/api/cart/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cart service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Server will start but functionality may be limited.');
    }
    
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database. Server will start but functionality may be limited.');
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Cart service running on port ${PORT}`);
      console.log(`Environment variables:`, {
        DB_HOST: process.env.DB_HOST,
        DB_NAME: process.env.DB_NAME,
        SERVICE_PORT: process.env.SERVICE_PORT,
        JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
        PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
        FRONTEND_URL: process.env.FRONTEND_URL
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();