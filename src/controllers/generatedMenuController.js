const GeneratedMenuService = require('../services/generatedMenuService');
const { successResponse } = require('../utils/response');

class GeneratedMenuController {
  // Get all generated menus
  static async getAllGeneratedMenus(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        per_page: req.query.per_page,
        q: req.query.q,
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const result = await GeneratedMenuService.getAllGeneratedMenus(filters);
      
      return res.status(200).json(successResponse(
        'Generated menus retrieved successfully',
        result.data,
        result.pagination
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get generated menu by ID
  static async getGeneratedMenuById(req, res, next) {
    try {
      const { id } = req.params;
      const generatedMenu = await GeneratedMenuService.getGeneratedMenuById(id);
      
      return res.status(200).json(successResponse(
        'Generated menu retrieved successfully',
        generatedMenu
      ));
    } catch (error) {
      next(error);
    }
  }

  // Delete generated menu
  static async deleteGeneratedMenu(req, res, next) {
    try {
      const { id } = req.params;
      const result = await GeneratedMenuService.deleteGeneratedMenu(id);
      
      return res.status(200).json(successResponse(
        result.message
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await GeneratedMenuService.getStatistics();
      
      return res.status(200).json(successResponse(
        'Statistics retrieved successfully',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get recent generations
  static async getRecentGenerations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const recentMenus = await GeneratedMenuService.getRecentGenerations(limit);
      
      return res.status(200).json(successResponse(
        'Recent generated menus retrieved successfully',
        recentMenus
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeneratedMenuController;
