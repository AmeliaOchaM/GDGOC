const express = require('express');
const router = express.Router();
const menuRoutes = require('./menuRoutes');

// API routes
router.use('/menu', menuRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
