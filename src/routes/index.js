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

module.exports = router;
