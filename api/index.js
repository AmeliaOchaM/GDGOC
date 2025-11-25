require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('../src/routes');
const errorHandler = require('../src/middlewares/errorHandler');
const notFoundHandler = require('../src/middlewares/notFound');

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
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

// API Routes (mounted at root since Vercel rewrites to /api/index.js)
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
