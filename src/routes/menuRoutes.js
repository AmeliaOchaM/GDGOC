const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');
const { validateCaloriesRequest } = require('../middlewares/validator');

// Special routes (must come before /:id to avoid conflicts)
// GET /menu/group-by-category?mode=count
// GET /menu/group-by-category?mode=list&per_category=5
router.get('/group-by-category', MenuController.groupByCategory);

// GET /menu/search?q={{q}}&page={{page}}&per_page={{per_page}}
router.get('/search', MenuController.searchMenus);

// DELETE /menu/all - Delete all menus (use with caution)
router.delete('/all', MenuController.deleteAllMenus);

// CRUD routes
// POST /menu
router.post('/', MenuController.createMenu);

// POST /menu/auto-generate - Generate menu items using AI
router.post('/auto-generate', MenuController.autoGenerateMenu);

// GET /menu/auto-generate - Get all generated menu history
router.get('/auto-generate', MenuController.getAutoGenerateHistory);

// GET /menu/auto-generate/:id - Get specific generated menu
router.get('/auto-generate/:id', MenuController.getAutoGenerateById);

// DELETE /menu/auto-generate/:id - Delete specific generated menu
router.delete('/auto-generate/:id', MenuController.deleteAutoGenerate);

// POST /menu/recommendations - Get personalized recommendations
router.post('/recommendations', MenuController.getRecommendations);

// GET /menu/recommendations - Get recommendations history (placeholder)
router.get('/recommendations', MenuController.getRecommendationsHistory);

// DELETE /menu/recommendations/:id - Delete recommendation (placeholder)
router.delete('/recommendations/:id', MenuController.deleteRecommendation);

// POST /menu/calculate-calories - Calculate calories and get exercise recommendations
router.post('/calculate-calories', validateCaloriesRequest, MenuController.calculateCaloriesAndExercise);

// GET /menu/calculate-calories - Get all calorie calculation history
router.get('/calculate-calories', MenuController.getCalculateCaloriesHistory);

// GET /menu/calculate-calories/:id - Get specific calorie calculation
router.get('/calculate-calories/:id', MenuController.getCalculateCaloriesById);

// DELETE /menu/calculate-calories/:id - Delete specific calorie calculation
router.delete('/calculate-calories/:id', MenuController.deleteCalculateCalories);

// GET /menu
// GET /menu?q={{q}}&category={{category}}&min_price={{min_price}}&max_price={{max_price}}&max_cal={{max_cal}}&page={{page}}&per_page={{per_page}}&sort={{sort}}
router.get('/', MenuController.getAllMenus);

// GET /menu/:id (menu_id)
router.get('/:id', MenuController.getMenuById);

// PUT /menu/:id (menu_id)
router.put('/:id', MenuController.updateMenu);

// DELETE /menu/:id (menu_id)
router.delete('/:id', MenuController.deleteMenu);

module.exports = router;
