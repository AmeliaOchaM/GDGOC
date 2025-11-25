const GeneratedMenuModel = require('../models/generatedMenuModel');
const { NotFoundError } = require('../utils/errors');

class GeneratedMenuService {
  // Get all generated menus with filters
  static async getAllGeneratedMenus(filters) {
    return await GeneratedMenuModel.findAll(filters);
  }

  // Get generated menu by ID
  static async getGeneratedMenuById(id) {
    const generatedMenu = await GeneratedMenuModel.findById(id);
    
    if (!generatedMenu) {
      throw new NotFoundError(`Generated menu with id ${id} not found`);
    }
    
    return generatedMenu;
  }

  // Delete generated menu
  static async deleteGeneratedMenu(id) {
    const deleted = await GeneratedMenuModel.delete(id);
    
    if (!deleted) {
      throw new NotFoundError(`Generated menu with id ${id} not found`);
    }
    
    return { message: 'Generated menu deleted successfully' };
  }

  // Get statistics
  static async getStatistics() {
    return await GeneratedMenuModel.getStatistics();
  }

  // Get recent generations
  static async getRecentGenerations(limit = 10) {
    return await GeneratedMenuModel.getRecent(limit);
  }
}

module.exports = GeneratedMenuService;
