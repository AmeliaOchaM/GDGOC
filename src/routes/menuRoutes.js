const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

// Special routes (must come before /:id to avoid conflicts)
// GET /menu/group-by-category?mode=count
// GET /menu/group-by-category?mode=list&per_category=5
router.get('/group-by-category', MenuController.groupByCategory);

// GET /menu/search?q={{q}}&page={{page}}&per_page={{per_page}}
router.get('/search', MenuController.searchMenus);

// CRUD routes
// POST /menu
router.post('/', MenuController.createMenu);

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
