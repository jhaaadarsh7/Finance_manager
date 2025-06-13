const { runMigration, testConnection, closePool } = require('./config/database');

async function testMigrations() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Run migrations
    await runMigration();
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error during migration test:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

testMigrations(); 