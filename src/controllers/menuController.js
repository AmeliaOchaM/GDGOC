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
      const { prompt } = req.body;

      const fullPrompt = `
You are a professional menu generator. Generate menu items based on this request: "${prompt}"

IMPORTANT: Return ONLY a valid JSON array, nothing else. No markdown, no explanations, just the JSON array.

Each menu item must have this exact structure:
{
  "name": "string (creative Indonesian name)",
  "category": "string (use: 'main-course', 'beverage', 'dessert', or 'snacks')",
  "calories": number (realistic calorie count),
  "price": number (in Indonesian Rupiah),
  "ingredients": ["array", "of", "ingredient", "strings"],
  "description": "string (Tagline: [catchy tagline]. Short Description: [1-2 sentences]. Long Description: [detailed 3-4 sentences about the dish, its flavors, and why it's appealing])"
}

Requirements:
- Return an array of menu objects
- All fields are required
- No markdown code blocks (no \`\`\`json)
- Valid JSON only
- Realistic Indonesian menu items

Example format:
[
  {
    "name": "Nasi Goreng Spesial",
    "category": "main-course",
    "calories": 550,
    "price": 35000,
    "ingredients": ["rice", "egg", "vegetables", "soy sauce"],
    "description": "Tagline: The Taste of Indonesia. Short Description: Traditional fried rice with authentic spices. Long Description: Our signature fried rice combines aromatic jasmine rice with fresh vegetables, perfectly fried egg, and our secret blend of Indonesian spices that create an unforgettable taste experience."
  }
]

Now generate the menu items:
      `;

      // Use the new function that saves to database
      const result = await geminiService.generateMenuItemsAndSave(fullPrompt);
      const generatedItems = result.menu_items;

      const createdMenus = [];
      for (const item of generatedItems) {
        const menu = await MenuService.createMenu(item);
        createdMenus.push(menu);
      }

      return successResponse(res, {
        message: 'Menu items generated and created successfully',
        data: createdMenus,
        generation_saved_id: result.saved_id
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
