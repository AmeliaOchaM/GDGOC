const MenuService = require('../services/menuService');
const { successResponse, errorResponse } = require('../utils/response');
const geminiService = require('../services/geminiService');
const GeneratedMenuService = require('../services/generatedMenuService');
const CalorieCalculationService = require('../services/calorieCalculationService');
const { ValidationError } = require('../utils/errors');

class MenuController {
  // POST /menu - Create new menu
  static async createMenu(req, res, next) {
    try {
      const menu = await MenuService.createMenu(req.body);
      
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

      const result = await MenuService.getAllMenus(filters);
      
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
      const menu = await MenuService.getMenuById(req.params.id);
      
      return successResponse(res, { data: menu });
    } catch (error) {
      next(error);
    }
  }

  // PUT /menu/:id - Full update menu
  static async updateMenu(req, res, next) {
    try {
      const menu = await MenuService.updateMenu(req.params.id, req.body);
      
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
      await MenuService.deleteMenu(req.params.id);
      
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
      const result = await MenuService.deleteAllMenus();
      
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
      
      const data = await MenuService.groupByCategory(mode, perCategory);
      
      return successResponse(res, { data });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/search - Search menus
  static async searchMenus(req, res, next) {
    try {
      const { q, page, per_page } = req.query;
      
      const result = await MenuService.searchMenus(q, page, per_page);
      
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
      const { prompt, count } = req.body;

      // Validate inputs
      if (!prompt) {
        throw new ValidationError('Prompt is required');
      }

      const menuCount = parseInt(count) || 3; // Default to 3 if not provided

      const fullPrompt = `Generate exactly ${menuCount} Indonesian menu items based on: "${prompt}"

Return a JSON array with ${menuCount} objects. Each object must have:
- name: string (Indonesian name)
- category: one of "Makanan Berat", "Makanan Ringan", "Minuman", "Dessert"
- calories: number (50-1000)
- price: number (5000-150000)
- ingredients: array of strings
- description: string (format: "Tagline: [tagline]. Short Description: [1-2 sentences]. Long Description: [3-4 sentences]")

Example output structure:
[
  {
    "name": "Nasi Goreng Spesial",
    "category": "Makanan Berat",
    "calories": 550,
    "price": 35000,
    "ingredients": ["nasi", "ayam", "telur", "sayuran", "kecap"],
    "description": "Tagline: Cita Rasa Nusantara. Short Description: Nasi goreng tradisional dengan bumbu autentik. Long Description: Nasi goreng signature kami menggabungkan beras jasmine aromatik dengan sayuran segar, telur goreng sempurna, dan perpaduan rahasia bumbu Indonesia yang menciptakan pengalaman rasa tak terlupakan."
  }
]`;

      console.log('=== Auto Generate Menu Debug ===');
      console.log('Prompt:', prompt);
      console.log('Count:', menuCount);

      // Use the function that saves to database
      const result = await geminiService.generateMenuItemsAndSave(fullPrompt);
      const generatedItems = result.menu_items;

      console.log('Generated items count:', generatedItems.length);
      console.log('Generated items:', JSON.stringify(generatedItems, null, 2));

      // Create menus in database
      const createdMenus = [];
      for (const item of generatedItems) {
        try {
          const menu = await MenuService.createMenu(item);
          createdMenus.push(menu);
        } catch (error) {
          console.error('Error creating menu item:', error);
          // Continue with other items
        }
      }

      // Return structured response matching frontend expectations
      return successResponse(res, {
        message: 'Menu items generated successfully',
        data: {
          id: result.saved_id,
          prompt: prompt,
          count: menuCount,
          menus: createdMenus,
          generated_at: new Date().toISOString()
        }
      }, 201);
    } catch (error) {
      console.error('=== Auto Generate Menu Error ===');
      console.error('Error:', error);
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
      const availableMenus = await MenuService.getAllMenusNoPagination();

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
          menu = await MenuService.getMenuById(item.id);
        } else if (item.name) {
          // Search by name
          const allMenus = await MenuService.getAllMenusNoPagination();
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
      // And save to database
      const analysis = await geminiService.calculateCaloriesAndExerciseAndSave(menuDetails);

      return successResponse(res, {
        message: 'Calorie calculation and exercise recommendations generated successfully',
        data: analysis,
        calculation_saved_id: analysis.saved_id
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/auto-generate - Get all generated menu history
  static async getAutoGenerateHistory(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        per_page: req.query.per_page,
        q: req.query.q,
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const result = await GeneratedMenuService.getAllGeneratedMenus(filters);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/auto-generate/:id - Get specific generated menu by ID
  static async getAutoGenerateById(req, res, next) {
    try {
      const { id } = req.params;
      const generatedMenu = await GeneratedMenuService.getGeneratedMenuById(id);

      return successResponse(res, {
        message: 'Generated menu retrieved successfully',
        data: generatedMenu
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /menu/auto-generate/:id - Delete specific generated menu
  static async deleteAutoGenerate(req, res, next) {
    try {
      const { id } = req.params;
      const result = await GeneratedMenuService.deleteGeneratedMenu(id);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/recommendations - Get all recommendation history (placeholder - recommendations tidak disimpan)
  static async getRecommendationsHistory(req, res, next) {
    try {
      return successResponse(res, {
        message: 'Recommendations are not stored in database. Use POST /menu/recommendations to generate new recommendations.',
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /menu/recommendations/:id - Delete recommendation (placeholder)
  static async deleteRecommendation(req, res, next) {
    try {
      return successResponse(res, {
        message: 'Recommendations are not stored in database. Nothing to delete.'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/calculate-calories - Get all calorie calculation history
  static async getCalculateCaloriesHistory(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        per_page: req.query.per_page,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        min_calories: req.query.min_calories,
        max_calories: req.query.max_calories
      };

      const result = await CalorieCalculationService.getAllCalculations(filters);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // GET /menu/calculate-calories/:id - Get specific calorie calculation by ID
  static async getCalculateCaloriesById(req, res, next) {
    try {
      const { id } = req.params;
      const calculation = await CalorieCalculationService.getCalculationById(id);

      return successResponse(res, {
        message: 'Calorie calculation retrieved successfully',
        data: calculation
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /menu/calculate-calories/:id - Delete specific calorie calculation
  static async deleteCalculateCalories(req, res, next) {
    try {
      const { id } = req.params;
      const result = await CalorieCalculationService.deleteCalculation(id);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MenuController;
