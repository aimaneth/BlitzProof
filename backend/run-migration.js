require('ts-node/register');
const { initializeDatabase } = require('./src/config/init-db');

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    await initializeDatabase();
    console.log('✅ Database migration completed successfully!');
    console.log('🚀 You can now start the backend server.');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 