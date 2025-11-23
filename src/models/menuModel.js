const db = require('../config/database');

class MenuModel {
  // Create new menu item
  static create(menuData) {
    const { name, category, calories, price, ingredients, description } = menuData;
    
    const stmt = db.prepare(`
      INSERT INTO menu (name, category, calories, price, ingredients, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
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
    
    return info.changes > 0;
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
