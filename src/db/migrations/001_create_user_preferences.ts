/**
 * Migration: Create UserPreferences Collection
 * Creates the user_preferences collection with proper indexes
 */

import mongoose from 'mongoose';
import { connect } from '../dbconfig';

export async function up() {
  console.log('[Migration 001] Creating UserPreferences collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'userpreferences' }).toArray();
    
    if (collections.length > 0) {
      console.log('[Migration 001] UserPreferences collection already exists');
      return;
    }

    // Create collection
    await db.createCollection('userpreferences');
    console.log('[Migration 001] UserPreferences collection created');

    // Create indexes
    const collection = db.collection('userpreferences');
    
    // Unique index on userId
    await collection.createIndex({ userId: 1 }, { unique: true });
    console.log('[Migration 001] Created unique index on userId');

    // Index on timestamps for queries
    await collection.createIndex({ createdAt: 1 });
    await collection.createIndex({ updatedAt: 1 });
    console.log('[Migration 001] Created indexes on timestamps');

    console.log('[Migration 001] ✓ UserPreferences migration completed successfully');
  } catch (error) {
    console.error('[Migration 001] ✗ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('[Migration 001] Rolling back UserPreferences collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop collection
    await db.dropCollection('userpreferences');
    console.log('[Migration 001] ✓ UserPreferences collection dropped');
  } catch (error) {
    if ((error as any).code === 26) {
      // Collection doesn't exist, that's fine
      console.log('[Migration 001] Collection does not exist, nothing to rollback');
    } else {
      console.error('[Migration 001] ✗ Rollback failed:', error);
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
