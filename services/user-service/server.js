// services/user-service/server.js
const express = require('express');
const cors = require('cors');
const { testConnection, initializeDatabase } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // Make sure this is imported

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true
}));
app.use(express.json());

// Routes - Important: Make sure auth routes are registered
app.use('/api/auth', authRoutes); // This line is crucial
app.use('/api/users', userRoutes);
app.use('/api/admin', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('User service is healthy');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message, err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`User service running on port ${PORT}`);
  
  try {
    await testConnection();
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
});