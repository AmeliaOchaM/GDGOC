const { createClient } = require('@libsql/client');
const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = require('./env');

// Validate environment variables
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso credentials in environment variables');
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
}

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
    // Don't throw in serverless - just log
    // throw error;
  }
};

// Export both db and init function (don't run on import)
module.exports = { db, initDatabase };
