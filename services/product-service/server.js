const express = require('express');
const cors = require('cors');
const path = require('path');
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
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Product service is healthy');
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