const CalorieCalculationModel = require('../models/calorieCalculationModel');
const { NotFoundError } = require('../utils/errors');

class CalorieCalculationService {
  // Get all calorie calculations with filters
  static async getAllCalculations(filters) {
    return await CalorieCalculationModel.findAll(filters);
  }

  // Get calculation by ID
  static async getCalculationById(id) {
    const calculation = await CalorieCalculationModel.findById(id);
    
    if (!calculation) {
      throw new NotFoundError(`Calorie calculation with id ${id} not found`);
    }
    
    return calculation;
  }

  // Delete calculation
  static async deleteCalculation(id) {
    const deleted = await CalorieCalculationModel.delete(id);
    
    if (!deleted) {
      throw new NotFoundError(`Calorie calculation with id ${id} not found`);
    }
    
    return { message: 'Calorie calculation deleted successfully' };
  }

  // Get statistics
  static async getStatistics() {
    return await CalorieCalculationModel.getStatistics();
  }
}

module.exports = CalorieCalculationService;
