/**
 * Migration Runner
 * Runs all pending migrations in order
 */

import * as migration001 from './001_create_user_preferences';
import * as migration002 from './002_create_food_preferences';
import * as migration003 from './003_create_itinerary_restaurants';
import * as migration004 from './004_create_user_rating';

const migrations = [
  { name: '001_create_user_preferences', module: migration001 },
  { name: '002_create_food_preferences', module: migration002 },
  { name: '003_create_itinerary_restaurants', module: migration003 },
  { name: '004_create_user_rating', module: migration004 }
];

async function runMigrations() {
  console.log('='.repeat(60));
  console.log('Starting Database Migrations');
  console.log('='.repeat(60));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`Running migration: ${migration.name}`);
      await migration.module.up();
      successCount++;
      console.log('');
    } catch (error) {
      console.error(`Failed to run migration: ${migration.name}`);
      console.error(error);
      failCount++;
      console.log('');
      
      // Stop on first failure
      break;
    }
  }

  console.log('='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log('');

  if (failCount > 0) {
    console.error('Migrations failed. Please fix errors and try again.');
    process.exit(1);
  } else {
    console.log('All migrations completed successfully!');
    process.exit(0);
  }
}

async function rollbackMigrations() {
  console.log('='.repeat(60));
  console.log('Rolling Back Database Migrations');
  console.log('='.repeat(60));
  console.log('');

  // Run rollbacks in reverse order
  const reversedMigrations = [...migrations].reverse();

  for (const migration of reversedMigrations) {
    try {
      console.log(`Rolling back migration: ${migration.name}`);
      await migration.module.down();
      console.log('');
    } catch (error) {
      console.error(`Failed to rollback migration: ${migration.name}`);
      console.error(error);
      console.log('');
    }
  }

  console.log('Rollback completed');
  process.exit(0);
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'up') {
  runMigrations();
} else if (command === 'down') {
  rollbackMigrations();
} else {
  console.log('Usage:');
  console.log('  npm run migrate:up    - Run all migrations');
  console.log('  npm run migrate:down  - Rollback all migrations');
  process.exit(1);
}
