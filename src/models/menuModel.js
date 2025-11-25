const { db } = require('../config/database');

class MenuModel {
  // Get the next available ID
  static async getNextId() {
    const result = await db.execute('SELECT MAX(id) as maxId FROM menu');
    const maxId = result.rows[0]?.maxId;
    return maxId ? maxId + 1 : 1;
  }

  // Reset auto-increment sequence to start from 1
  static async resetAutoIncrement() {
    try {
      // Delete the sqlite_sequence entry for the menu table
      await db.execute("DELETE FROM sqlite_sequence WHERE name='menu'");
      return true;
    } catch (error) {
      console.error('Error resetting auto-increment:', error);
      return false;
    }
  }

  // Create new menu item
  static async create(menuData) {
    const { name, category, calories, price, ingredients, description } = menuData;
    
    // Let SQLite auto-increment handle the ID automatically
    const result = await db.execute({
      sql: `
        INSERT INTO menu (name, category, calories, price, ingredients, description)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      args: [
        name,
        category,
        calories,
        price,
        JSON.stringify(ingredients),
        description || null
      ]
    });
    
    // Parse ingredients and return the newly created item directly
    const menu = result.rows[0];
    if (menu && menu.ingredients) {
      menu.ingredients = JSON.parse(menu.ingredients);
    }
    
    return menu;
  }

  // Find menu by ID
  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM menu WHERE id = ?',
      args: [id]
    });
    
    const menu = result.rows[0];
    
    if (menu && menu.ingredients) {
      menu.ingredients = JSON.parse(menu.ingredients);
    }
    
    return menu;
  }

  // Find all menus with filters and pagination
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM menu WHERE 1=1';
    const params = [];

    // Apply filters
    if (filters.q) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.q}%`, `%${filters.q}%`);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.min_price) {
      query += ' AND price >= ?';
      params.push(parseFloat(filters.min_price));
    }

    if (filters.max_price) {
      query += ' AND price <= ?';
      params.push(parseFloat(filters.max_price));
    }

    if (filters.max_cal) {
      query += ' AND calories <= ?';
      params.push(parseInt(filters.max_cal));
    }

    // Count total before pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.execute({
      sql: countQuery,
      args: params
    });
    const total = countResult.rows[0]?.total || 0;

    // Apply sorting
    if (filters.sort) {
      const [field, order] = filters.sort.split(':');
      const validFields = ['name', 'category', 'calories', 'price', 'created_at'];
      const validOrder = ['asc', 'desc'];
      
      if (validFields.includes(field) && validOrder.includes(order.toLowerCase())) {
        query += ` ORDER BY ${field} ${order.toUpperCase()}`;
      }
    } else {
      query += ' ORDER BY created_at DESC';
    }

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
    
    let menus = result.rows;

    // Parse ingredients JSON
    menus = menus.map(menu => ({
      ...menu,
      ingredients: JSON.parse(menu.ingredients)
    }));

    return {
      data: menus,
      pagination: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page)
      }
    };
  }

  // Update menu (full update)
  static async update(id, menuData) {
    const { name, category, calories, price, ingredients, description } = menuData;
    
    const result = await db.execute({
      sql: `
        UPDATE menu 
        SET name = ?, category = ?, calories = ?, price = ?, ingredients = ?, 
            description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        name,
        category,
        calories,
        price,
        JSON.stringify(ingredients),
        description,
        id
      ]
    });
    
    if (result.rowsAffected === 0) {
      return null;
    }
    
    return this.findById(id);
  }

  // Delete menu
  static async delete(id) {
    const result = await db.execute({
      sql: 'DELETE FROM menu WHERE id = ?',
      args: [id]
    });
    
    // Check if table is empty after deletion
    const countResult = await db.execute('SELECT COUNT(*) as count FROM menu');
    const count = countResult.rows[0]?.count || 0;
    
    // Reset auto-increment if table is empty
    if (count === 0) {
      await this.resetAutoIncrement();
    }
    
    return result.rowsAffected > 0;
  }

  // Delete all menus
  static async deleteAll() {
    const result = await db.execute('DELETE FROM menu');
    
    // Reset auto-increment after deleting all
    await this.resetAutoIncrement();
    
    return result.rowsAffected;
  }

  // Count total menus
  static async count() {
    const result = await db.execute('SELECT COUNT(*) as count FROM menu');
    const count = result.rows[0]?.count || 0;
    return count;
  }

  // Group by category (count mode)
  static async groupByCategory() {
    const result = await db.execute(`
      SELECT category, COUNT(*) as count
      FROM menu
      GROUP BY category
    `);
    
    const grouped = {};
    
    result.rows.forEach(row => {
      grouped[row.category] = row.count;
    });
    
    return grouped;
  }

  // Group by category (list mode)
  static async groupByCategoryList(perCategory = 5) {
    const result = await db.execute(`
      SELECT * FROM menu
      ORDER BY category, created_at DESC
    `);
    
    let menus = result.rows;
    
    // Parse ingredients
    menus = menus.map(menu => ({
      ...menu,
      ingredients: JSON.parse(menu.ingredients)
    }));
    
    // Group by category and limit per category
    const grouped = {};
    menus.forEach(menu => {
      if (!grouped[menu.category]) {
        grouped[menu.category] = [];
      }
      if (grouped[menu.category].length < perCategory) {
        grouped[menu.category].push(menu);
      }
    });
    
    return grouped;
  }

  // Search with full-text (convenience method, similar to findAll with q filter)
  static async search(query, page = 1, per_page = 10) {
    return this.findAll({ q: query, page, per_page });
  }
}

module.exports = MenuModel;
