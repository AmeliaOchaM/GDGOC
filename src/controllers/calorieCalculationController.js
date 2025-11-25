const CalorieCalculationService = require('../services/calorieCalculationService');
const { successResponse } = require('../utils/response');

class CalorieCalculationController {
  // Get all calorie calculations
  static async getAllCalculations(req, res, next) {
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
      
      return res.status(200).json(successResponse(
        'Calorie calculations retrieved successfully',
        result.data,
        result.pagination
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get calculation by ID
  static async getCalculationById(req, res, next) {
    try {
      const { id } = req.params;
      const calculation = await CalorieCalculationService.getCalculationById(id);
      
      return res.status(200).json(successResponse(
        'Calorie calculation retrieved successfully',
        calculation
      ));
    } catch (error) {
      next(error);
    }
  }

  // Delete calculation
  static async deleteCalculation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await CalorieCalculationService.deleteCalculation(id);
      
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
      const stats = await CalorieCalculationService.getStatistics();
      
      return res.status(200).json(successResponse(
        'Statistics retrieved successfully',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CalorieCalculationController;
