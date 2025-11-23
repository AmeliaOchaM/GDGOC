const MenuModel = require('../models/menuModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

class MenuService {
  // Create new menu
  static createMenu(menuData) {
    // Validate required fields
    const { name, category, calories, price, ingredients } = menuData;
    
    if (!name || !category || calories === undefined || price === undefined || !ingredients) {
      throw new ValidationError('Missing required fields: name, category, calories, price, ingredients');
    }

    // Validate data types
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Name must be a non-empty string');
    }

    if (typeof category !== 'string' || category.trim().length === 0) {
      throw new ValidationError('Category must be a non-empty string');
    }

    if (!Number.isInteger(calories) || calories < 0) {
      throw new ValidationError('Calories must be a non-negative integer');
    }

    if (typeof price !== 'number' || price < 0) {
      throw new ValidationError('Price must be a non-negative number');
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new ValidationError('Ingredients must be a non-empty array');
    }

    return MenuModel.create(menuData);
  }

  // Get menu by ID
  static getMenuById(id) {
    const menu = MenuModel.findById(id);
    
    if (!menu) {
      throw new NotFoundError(`Menu with id ${id} not found`);
    }
    
    return menu;
  }

  // Get all menus with filters
  static getAllMenus(filters) {
    return MenuModel.findAll(filters);
  }

  // Update menu
  static updateMenu(id, menuData) {
    // Check if menu exists
    const existingMenu = MenuModel.findById(id);
    if (!existingMenu) {
      throw new NotFoundError(`Menu with id ${id} not found`);
    }

    // Validate required fields for full update
    const { name, category, calories, price, ingredients } = menuData;
    
    if (!name || !category || calories === undefined || price === undefined || !ingredients) {
      throw new ValidationError('Missing required fields for update: name, category, calories, price, ingredients');
    }

    // Validate data types
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Name must be a non-empty string');
    }

    if (typeof category !== 'string' || category.trim().length === 0) {
      throw new ValidationError('Category must be a non-empty string');
    }

    if (!Number.isInteger(calories) || calories < 0) {
      throw new ValidationError('Calories must be a non-negative integer');
    }

    if (typeof price !== 'number' || price < 0) {
      throw new ValidationError('Price must be a non-negative number');
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new ValidationError('Ingredients must be a non-empty array');
    }

    return MenuModel.update(id, menuData);
  }

  // Delete menu
  static deleteMenu(id) {
    // Check if menu exists
    const existingMenu = MenuModel.findById(id);
    if (!existingMenu) {
      throw new NotFoundError(`Menu with id ${id} not found`);
    }

    const deleted = MenuModel.delete(id);
    
    if (!deleted) {
      throw new Error('Failed to delete menu');
    }
    
    return true;
  }

  // Group by category
  static groupByCategory(mode = 'count', perCategory = 5) {
    if (mode === 'list') {
      return MenuModel.groupByCategoryList(parseInt(perCategory));
    }
    
    return MenuModel.groupByCategory();
  }

  // Search menus
  static searchMenus(query, page, perPage) {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty');
    }
    
    return MenuModel.search(query, page, perPage);
  }
}

module.exports = MenuService;
