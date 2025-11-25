// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'GDGOC Menu Catalog API is running',
    version: '1.0.0',
    endpoints: {
      menus: '/api/menu',
      calories: '/api/calories',
      generate: '/api/generate',
      health: '/api/health'
    }
  });
});

// Health check at /api
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Health Check OK',
    timestamp: new Date().toISOString()
  });
});

// Import routes with error handling
try {
  const routes = require('../src/routes');
  app.use('/api', routes);
} catch (error) {
  console.error('Error loading routes:', error);
  app.use('/api', (req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load routes',
      error: error.message
    });
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel serverless
module.exports = app;
