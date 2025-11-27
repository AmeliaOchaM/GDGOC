const express = require('express');
const router = express.Router();
const menuRoutes = require('./menuRoutes');
const calorieCalculationRoutes = require('./calorieCalculationRoutes');
const generatedMenuRoutes = require('./generatedMenuRoutes');

// API routes
router.use('/menu', menuRoutes);
router.use('/calorie-calculations', calorieCalculationRoutes);
router.use('/generated-menus', generatedMenuRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Environment check (FOR TESTING ONLY - REMOVE IN PRODUCTION)
router.get('/env-check', (req, res) => {
  res.json({
    gemini_api_key_exists: !!process.env.GEMINI_API_KEY,
    gemini_api_key_length: process.env.GEMINI_API_KEY?.length || 0,
    turso_url_exists: !!process.env.TURSO_DATABASE_URL,
    turso_token_exists: !!process.env.TURSO_AUTH_TOKEN,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

module.exports = router;
