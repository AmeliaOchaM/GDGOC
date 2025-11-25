const { db, initDatabase } = require('./config/database');
const CalorieCalculationModel = require('./models/calorieCalculationModel');
const GeneratedMenuModel = require('./models/generatedMenuModel');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Initialize main database (menu table)
    console.log('Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized');
    
    // Create calorie_calculations table
    console.log('Creating calorie_calculations table...');
    await CalorieCalculationModel.createTable();
    console.log('✓ calorie_calculations table created');
    
    // Create generated_menus table
    console.log('Creating generated_menus table...');
    await GeneratedMenuModel.createTable();
    console.log('✓ generated_menus table created');
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
