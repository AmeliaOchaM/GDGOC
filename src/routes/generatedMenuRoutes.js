const express = require('express');
const router = express.Router();
const GeneratedMenuController = require('../controllers/generatedMenuController');

// Get all generated menus with filters
router.get('/', GeneratedMenuController.getAllGeneratedMenus);

// Get statistics
router.get('/statistics', GeneratedMenuController.getStatistics);

// Get recent generations
router.get('/recent', GeneratedMenuController.getRecentGenerations);

// Get generated menu by ID
router.get('/:id', GeneratedMenuController.getGeneratedMenuById);

// Delete generated menu
router.delete('/:id', GeneratedMenuController.deleteGeneratedMenu);

module.exports = router;
