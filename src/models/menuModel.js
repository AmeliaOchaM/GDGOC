const db = require('../config/database');

class MenuModel {
  // Get the next available ID
  static getNextId() {
    const stmt = db.prepare('SELECT MAX(id) as maxId FROM menu');
    const result = stmt.get();
    return result.maxId ? result.maxId + 1 : 1;
  }

  // Reset auto-increment sequence to start from 1
  static resetAutoIncrement() {
    try {
      // Delete the sqlite_sequence entry for the menu table
      const stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='menu'");
      stmt.run();
      return true;
    } catch (error) {
      console.error('Error resetting auto-increment:', error);
      return false;
    }
  }

  // Create new menu item
  static create(menuData) {
    const { name, category, calories, price, ingredients, description } = menuData;
    
    // Get the next available ID
    const nextId = this.getNextId();
    
    const stmt = db.prepare(`
      INSERT INTO menu (id, name, category, calories, price, ingredients, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      nextId,
      name,
      category,
      calories,
      price,
      JSON.stringify(ingredients),
      description
    );
    
    return this.findById(info.lastInsertRowid);
  }

  // Find menu by ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM menu WHERE id = ?');
    const menu = stmt.get(id);
    
    if (menu && menu.ingredients) {
      menu.ingredients = JSON.parse(menu.ingredients);
    }
    
    return menu;
  }

  // Find all menus with filters and pagination
  static findAll(filters = {}) {
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
    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...params);

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

    const stmt = db.prepare(query);
    let menus = stmt.all(...params);

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
  static update(id, menuData) {
    const { name, category, calories, price, ingredients, description } = menuData;
    
    const stmt = db.prepare(`
      UPDATE menu 
      SET name = ?, category = ?, calories = ?, price = ?, ingredients = ?, 
          description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      name,
      category,
      calories,
      price,
      JSON.stringify(ingredients),
      description,
      id
    );
    
    if (info.changes === 0) {
      return null;
    }
    
    return this.findById(id);
  }

  // Delete menu
  static delete(id) {
    const stmt = db.prepare('DELETE FROM menu WHERE id = ?');
    const info = stmt.run(id);
    
    // Check if table is empty after deletion
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM menu');
    const { count } = countStmt.get();
    
    // Reset auto-increment if table is empty
    if (count === 0) {
      this.resetAutoIncrement();
    }
    
    return info.changes > 0;
  }

  // Delete all menus
  static deleteAll() {
    const stmt = db.prepare('DELETE FROM menu');
    const info = stmt.run();
    
    // Reset auto-increment after deleting all
    this.resetAutoIncrement();
    
    return info.changes;
  }

  // Count total menus
  static count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM menu');
    const { count } = stmt.get();
    return count;
  }

  // Group by category (count mode)
  static groupByCategory() {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM menu
      GROUP BY category
    `);
    
    const results = stmt.all();
    const grouped = {};
    
    results.forEach(row => {
      grouped[row.category] = row.count;
    });
    
    return grouped;
  }

  // Group by category (list mode)
  static groupByCategoryList(perCategory = 5) {
    const stmt = db.prepare(`
      SELECT * FROM menu
      ORDER BY category, created_at DESC
    `);
    
    let menus = stmt.all();
    
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
  static search(query, page = 1, per_page = 10) {
    return this.findAll({ q: query, page, per_page });
  }
}

module.exports = MenuModel;
