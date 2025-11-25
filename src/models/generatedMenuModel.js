const { db } = require('../config/database');

class GeneratedMenuModel {
  // Create table if not exists
  static async createTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS generated_menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        menu_items TEXT NOT NULL,
        generation_metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Create new generated menu record
  static async create(generatedMenuData) {
    const {
      prompt,
      menu_items,
      generation_metadata
    } = generatedMenuData;

    const result = await db.execute({
      sql: `
        INSERT INTO generated_menus (
          prompt, menu_items, generation_metadata
        )
        VALUES (?, ?, ?)
        RETURNING *
      `,
      args: [
        prompt,
        JSON.stringify(menu_items),
        generation_metadata ? JSON.stringify(generation_metadata) : null
      ]
    });

    const generatedMenu = result.rows[0];
    return this._parseJsonFields(generatedMenu);
  }

  // Find generated menu by ID
  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM generated_menus WHERE id = ?',
      args: [id]
    });

    const generatedMenu = result.rows[0];
    return generatedMenu ? this._parseJsonFields(generatedMenu) : null;
  }

  // Find all generated menus with pagination
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM generated_menus WHERE 1=1';
    const params = [];

    // Search by prompt
    if (filters.q) {
      query += ' AND prompt LIKE ?';
      params.push(`%${filters.q}%`);
    }

    // Filter by date range
    if (filters.start_date) {
      query += ' AND created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND created_at <= ?';
      params.push(filters.end_date);
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

    const generatedMenus = result.rows.map(menu => this._parseJsonFields(menu));

    return {
      data: generatedMenus,
      pagination: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page)
      }
    };
  }

  // Delete generated menu
  static async delete(id) {
    const result = await db.execute({
      sql: 'DELETE FROM generated_menus WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  }

  // Get statistics
  static async getStatistics() {
    const result = await db.execute(`
      SELECT 
        COUNT(*) as total_generations,
        COUNT(DISTINCT prompt) as unique_prompts
      FROM generated_menus
    `);

    return result.rows[0];
  }

  // Get recent generations
  static async getRecent(limit = 10) {
    const result = await db.execute({
      sql: `
        SELECT * FROM generated_menus
        ORDER BY created_at DESC
        LIMIT ?
      `,
      args: [limit]
    });

    return result.rows.map(menu => this._parseJsonFields(menu));
  }

  // Helper method to parse JSON fields
  static _parseJsonFields(generatedMenu) {
    if (!generatedMenu) return null;

    return {
      ...generatedMenu,
      menu_items: JSON.parse(generatedMenu.menu_items),
      generation_metadata: generatedMenu.generation_metadata 
        ? JSON.parse(generatedMenu.generation_metadata) 
        : null
    };
  }
}

module.exports = GeneratedMenuModel;
