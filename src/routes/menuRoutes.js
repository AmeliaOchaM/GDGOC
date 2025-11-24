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

// POST /menu/auto-generate
router.post('/auto-generate', MenuController.autoGenerateMenu);

// POST /menu/recommendations
router.post('/recommendations', MenuController.getRecommendations);

// POST /menu/calculate-calories
router.post('/calculate-calories', validateCaloriesRequest, MenuController.calculateCaloriesAndExercise);

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
