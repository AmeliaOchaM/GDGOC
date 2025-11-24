const MenuService = require('../services/menuService');
const { successResponse, errorResponse } = require('../utils/response');
const geminiService = require('../services/geminiService');
const { ValidationError } = require('../utils/errors');

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

  // DELETE /menu - Delete all menus
  static async deleteAllMenus(req, res, next) {
    try {
      const result = MenuService.deleteAllMenus();
      
      return successResponse(res, {
        message: result.message,
        data: {
          deleted_count: result.deleted
        }
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

  // POST /menu/auto-generate - Auto generate menu
  static async autoGenerateMenu(req, res, next) {
    try {
      const { prompt } = req.body;

      const fullPrompt = `
        Generate a list of menu items based on the following prompt: "${prompt}".
        The output must be a valid JSON array. Each object in the array must follow this schema:
        {
          "name": "string",
          "category": "string (e.g., 'main-course', 'beverage', 'dessert')",
          "calories": "number",
          "price": "number",
          "ingredients": "array of strings",
          "description": "string"
        }
        
        Provide a creative and persuasive name and description for each menu item.
        Also, provide a short and long description, and a tagline.
        Make sure the JSON is well-formed.
      `;

      const generatedItems = await geminiService.generateMenuItems(fullPrompt);

      const createdMenus = [];
      for (const item of generatedItems) {
        const menu = MenuService.createMenu(item);
        createdMenus.push(menu);
      }

      return successResponse(res, {
        message: 'Menu items generated and created successfully',
        data: createdMenus
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /menu/recommendations - Get personalized menu recommendations
  static async getRecommendations(req, res, next) {
    try {
      const preferences = req.body;

      // Validate that at least some preferences are provided
      if (!preferences || Object.keys(preferences).length === 0) {
        throw new ValidationError('Please provide your preferences for recommendations');
      }

      // Get all available menus from database
      const availableMenus = MenuService.getAllMenusNoPagination();

      // Check if we have enough menu items in each category (flexible category names)
      const mainCourses = availableMenus.filter(m => 
        m.category === 'main-course' || m.category === 'foods' || m.category === 'food'
      );
      const beverages = availableMenus.filter(m => 
        m.category === 'beverage' || m.category === 'beverages' || 
        m.category === 'drink' || m.category === 'drinks'
      );
      const desserts = availableMenus.filter(m => 
        m.category === 'dessert' || m.category === 'desserts' || m.category === 'snacks'
      );

      if (mainCourses.length === 0 || beverages.length === 0 || desserts.length === 0) {
        throw new ValidationError(
          `Insufficient menu items in database. Found: ${mainCourses.length} main courses, ${beverages.length} beverages, ${desserts.length} desserts. Please ensure there are items in all categories.`
        );
      }

      // Pass available menus to Gemini for recommendation
      const recommendations = await geminiService.recommendMenus(preferences, availableMenus);

      return successResponse(res, {
        message: 'Menu recommendations generated successfully',
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /menu/calculate-calories - Calculate calories and get exercise recommendations
  static async calculateCaloriesAndExercise(req, res, next) {
    try {
      const { menu_items } = req.body;

      // Validate input
      if (!menu_items || !Array.isArray(menu_items) || menu_items.length === 0) {
        throw new ValidationError('Please provide an array of menu items with their IDs or names');
      }

      // Fetch complete menu details from database
      const menuDetails = [];
      for (const item of menu_items) {
        let menu;
        
        // Support both ID and name lookup
        if (item.id) {
          menu = MenuService.getMenuById(item.id);
        } else if (item.name) {
          // Search by name
          const allMenus = MenuService.getAllMenusNoPagination();
          menu = allMenus.find(m => 
            m.name.toLowerCase() === item.name.toLowerCase()
          );
          if (!menu) {
            throw new ValidationError(`Menu item "${item.name}" not found in database`);
          }
        } else {
          throw new ValidationError('Each menu item must have either an "id" or "name" field');
        }

        menuDetails.push({
          id: menu.id,
          name: menu.name,
          calories: menu.calories,
          ingredients: menu.ingredients,
          quantity: item.quantity || 1
        });
      }

      // Calculate total calories and get exercise recommendations using Gemini
      const analysis = await geminiService.calculateCaloriesAndExercise(menuDetails);

      return successResponse(res, {
        message: 'Calorie calculation and exercise recommendations generated successfully',
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MenuController;
