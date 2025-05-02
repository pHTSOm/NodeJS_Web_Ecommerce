const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/src/assets')));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Simple test route to verify the server works
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Import routes AFTER setting up basic middleware
const routes = require('./routes');
app.use('/api', routes);

// Database connection - import AFTER defining app
const { testConnection, initializeDatabase } = require('./config/db');

// Simple error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server first
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize database after server is running
(async () => {
  try {
    await testConnection();
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't crash the server if database initialization fails
  }
})();