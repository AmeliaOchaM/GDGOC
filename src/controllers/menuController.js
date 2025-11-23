const MenuService = require('../services/menuService');
const { successResponse, errorResponse } = require('../utils/response');

class MenuController {
  // POST /menu - Create new menu
  static async createMenu(req, res, next) {
    try {
      const menu = MenuService.createMenu(req.body);
      
      return successResponse(res, {
        message: 'Menu created successfully',
        data: menu
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /menu - Get all menus with filters and pagination
  static async getAllMenus(req, res, next) {
    try {
      const filters = {
        q: req.query.q,
        category: req.query.category,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        max_cal: req.query.max_cal,
        page: req.query.page,
        per_page: req.query.per_page,
        sort: req.query.sort
      };

      const result = MenuService.getAllMenus(filters);
      
      // Return pagination only if page or per_page is specified
      if (req.query.page || req.query.per_page) {
        return successResponse(res, result);
      }
      
      // Return only data if no pagination params
      return successResponse(res, { data: result.data });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/:id - Get menu by ID
  static async getMenuById(req, res, next) {
    try {
      const menu = MenuService.getMenuById(req.params.id);
      
      return successResponse(res, { data: menu });
    } catch (error) {
      next(error);
    }
  }

  // PUT /menu/:id - Full update menu
  static async updateMenu(req, res, next) {
    try {
      const menu = MenuService.updateMenu(req.params.id, req.body);
      
      return successResponse(res, {
        message: 'Menu updated successfully',
        data: menu
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /menu/:id - Delete menu
  static async deleteMenu(req, res, next) {
    try {
      MenuService.deleteMenu(req.params.id);
      
      return successResponse(res, {
        message: 'Menu deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/group-by-category - Group menus by category
  static async groupByCategory(req, res, next) {
    try {
      const mode = req.query.mode || 'count';
      const perCategory = req.query.per_category || 5;
      
      const data = MenuService.groupByCategory(mode, perCategory);
      
      return successResponse(res, { data });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/search - Search menus
  static async searchMenus(req, res, next) {
    try {
      const { q, page, per_page } = req.query;
      
      const result = MenuService.searchMenus(q, page, per_page);
      
      // Return pagination if page or per_page is specified
      if (page || per_page) {
        return successResponse(res, result);
      }
      
      return successResponse(res, { data: result.data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MenuController;
