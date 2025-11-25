const express = require('express');
const router = express.Router();
const CalorieCalculationController = require('../controllers/calorieCalculationController');

// Get all calorie calculations with filters
router.get('/', CalorieCalculationController.getAllCalculations);

// Get statistics
router.get('/statistics', CalorieCalculationController.getStatistics);

// Get calculation by ID
router.get('/:id', CalorieCalculationController.getCalculationById);

// Delete calculation
router.delete('/:id', CalorieCalculationController.deleteCalculation);

module.exports = router;
