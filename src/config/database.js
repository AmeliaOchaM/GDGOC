const { createClient } = require('@libsql/client');
const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = require('./env');

// Create Turso database connection
const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Initialize database tables
const initDatabase = async () => {
  const createMenuTable = `
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      calories INTEGER NOT NULL,
      price REAL NOT NULL,
      ingredients TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await db.execute(createMenuTable);
    console.log('✅ Turso database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Initialize on startup
initDatabase();

module.exports = db;
