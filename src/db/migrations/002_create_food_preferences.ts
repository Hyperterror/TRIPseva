/**
 * Migration: Create FoodPreferences Collection
 * Creates the food_preferences collection with proper indexes
 */

import mongoose from 'mongoose';
import { connect } from '../dbconfig';

export async function up() {
  console.log('[Migration 002] Creating FoodPreferences collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'foodpreferences' }).toArray();
    
    if (collections.length > 0) {
      console.log('[Migration 002] FoodPreferences collection already exists');
      return;
    }

    // Create collection
    await db.createCollection('foodpreferences');
    console.log('[Migration 002] FoodPreferences collection created');

    // Create indexes
    const collection = db.collection('foodpreferences');
    
    // Unique index on userId
    await collection.createIndex({ userId: 1 }, { unique: true });
    console.log('[Migration 002] Created unique index on userId');

    // Index on timestamps
    await collection.createIndex({ createdAt: 1 });
    await collection.createIndex({ updatedAt: 1 });
    console.log('[Migration 002] Created indexes on timestamps');

    console.log('[Migration 002] ✓ FoodPreferences migration completed successfully');
  } catch (error) {
    console.error('[Migration 002] ✗ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('[Migration 002] Rolling back FoodPreferences collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop collection
    await db.dropCollection('foodpreferences');
    console.log('[Migration 002] ✓ FoodPreferences collection dropped');
  } catch (error) {
    if ((error as any).code === 26) {
      console.log('[Migration 002] Collection does not exist, nothing to rollback');
    } else {
      console.error('[Migration 002] ✗ Rollback failed:', error);
      throw error;
    }
  }
}

// Run migration if executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
