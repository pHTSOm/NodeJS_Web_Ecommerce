// services/user-service/server.js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const { testConnection, initializeDatabase } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize passport
require('./config/passport')();

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Set up CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true
}));

// Parse JSON requests
app.use(express.json());

// Session middleware (needed for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard_cat_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport middleware
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
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
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
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