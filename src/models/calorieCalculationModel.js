const db = require('../config/database');

class CalorieCalculationModel {
  // Create table if not exists
  static async createTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calorie_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_items TEXT NOT NULL,
        total_calories INTEGER NOT NULL,
        nutritional_breakdown TEXT NOT NULL,
        menu_details TEXT NOT NULL,
        exercise_recommendations TEXT NOT NULL,
        health_notes TEXT,
        summary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Create new calorie calculation record
  static async create(calculationData) {
    const {
      menu_items,
      total_calories,
      nutritional_breakdown,
      menu_details,
      exercise_recommendations,
      health_notes,
      summary
    } = calculationData;

    const result = await db.execute({
      sql: `
        INSERT INTO calorie_calculations (
          menu_items, total_calories, nutritional_breakdown, menu_details,
          exercise_recommendations, health_notes, summary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      args: [
        JSON.stringify(menu_items),
        total_calories,
        JSON.stringify(nutritional_breakdown),
        JSON.stringify(menu_details),
        JSON.stringify(exercise_recommendations),
        health_notes,
        summary
      ]
    });

    const calculation = result.rows[0];
    return this._parseJsonFields(calculation);
  }

  // Find calculation by ID
  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM calorie_calculations WHERE id = ?',
      args: [id]
    });

    const calculation = result.rows[0];
    return calculation ? this._parseJsonFields(calculation) : null;
  }

  // Find all calculations with pagination
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM calorie_calculations WHERE 1=1';
    const params = [];

    // Filter by date range
    if (filters.start_date) {
      query += ' AND created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND created_at <= ?';
      params.push(filters.end_date);
    }

    // Filter by calorie range
    if (filters.min_calories) {
      query += ' AND total_calories >= ?';
      params.push(parseInt(filters.min_calories));
    }

    if (filters.max_calories) {
      query += ' AND total_calories <= ?';
      params.push(parseInt(filters.max_calories));
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.execute({
      sql: countQuery,
      args: params
    });
    const total = countResult.rows[0]?.total || 0;

    // Apply sorting
    query += ' ORDER BY created_at DESC';

    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const per_page = parseInt(filters.per_page) || 10;
    const offset = (page - 1) * per_page;

    query += ' LIMIT ? OFFSET ?';
    params.push(per_page, offset);

    const result = await db.execute({
      sql: query,
      args: params
    });

    const calculations = result.rows.map(calc => this._parseJsonFields(calc));

    return {
      data: calculations,
      pagination: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page)
      }
    };
  }

  // Delete calculation
  static async delete(id) {
    const result = await db.execute({
      sql: 'DELETE FROM calorie_calculations WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  }

  // Get statistics
  static async getStatistics() {
    const result = await db.execute(`
      SELECT 
        COUNT(*) as total_calculations,
        AVG(total_calories) as avg_calories,
        MIN(total_calories) as min_calories,
        MAX(total_calories) as max_calories
      FROM calorie_calculations
    `);

    return result.rows[0];
  }

  // Helper method to parse JSON fields
  static _parseJsonFields(calculation) {
    if (!calculation) return null;

    return {
      ...calculation,
      menu_items: JSON.parse(calculation.menu_items),
      nutritional_breakdown: JSON.parse(calculation.nutritional_breakdown),
      menu_details: JSON.parse(calculation.menu_details),
      exercise_recommendations: JSON.parse(calculation.exercise_recommendations)
    };
  }
}

module.exports = CalorieCalculationModel;
