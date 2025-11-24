const MenuModel = require('../models/menuModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

class MenuService {
  // Create new menu
  static async createMenu(menuData) {
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

    return await MenuModel.create(menuData);
  }

  // Get menu by ID
  static async getMenuById(id) {
    const menu = await MenuModel.findById(id);
    
    if (!menu) {
      throw new NotFoundError(`Menu with id ${id} not found`);
    }
    
    return menu;
  }

  // Get all menus with filters
  static async getAllMenus(filters) {
    return await MenuModel.findAll(filters);
  }

  // Update menu
  static async updateMenu(id, menuData) {
    // Check if menu exists
    const existingMenu = await MenuModel.findById(id);
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

    return await MenuModel.update(id, menuData);
  }

  // Delete menu
  static async deleteMenu(id) {
    // Check if menu exists
    const existingMenu = await MenuModel.findById(id);
    if (!existingMenu) {
      throw new NotFoundError(`Menu with id ${id} not found`);
    }

    const deleted = await MenuModel.delete(id);
    
    if (!deleted) {
      throw new Error('Failed to delete menu');
    }
    
    return true;
  }

  // Delete all menus
  static async deleteAllMenus() {
    const deletedCount = await MenuModel.deleteAll();
    
    return {
      deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} menu items and reset ID sequence`
    };
  }

  // Get total count
  static async getMenuCount() {
    return await MenuModel.count();
  }

  // Group by category
  static async groupByCategory(mode = 'count', perCategory = 5) {
    if (mode === 'list') {
      return await MenuModel.groupByCategoryList(parseInt(perCategory));
    }
    
    return await MenuModel.groupByCategory();
  }

  // Search menus
  static async searchMenus(query, page, perPage) {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty');
    }
    
    return await MenuModel.search(query, page, perPage);
  }

  // Get menus by category
  static async getMenusByCategory(category) {
    const result = await MenuModel.findAll({ category, per_page: 1000 });
    return result.data;
  }

  // Get all menus without pagination
  static async getAllMenusNoPagination() {
    const result = await MenuModel.findAll({ per_page: 10000 });
    return result.data;
  }
}

module.exports = MenuService;
