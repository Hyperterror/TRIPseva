/**
 * Migration: Create UserRating Collection
 * Creates the user_ratings collection with compound unique index for duplicate prevention
 */

import mongoose from 'mongoose';
import { connect } from '../dbconfig';

export async function up() {
  console.log('[Migration 004] Creating UserRating collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'userratings' }).toArray();
    
    if (collections.length > 0) {
      console.log('[Migration 004] UserRating collection already exists');
      return;
    }

    // Create collection
    await db.createCollection('userratings');
    console.log('[Migration 004] UserRating collection created');

    // Create indexes
    const collection = db.collection('userratings');
    
    // Index on ratedUserId for fetching user's ratings
    await collection.createIndex({ ratedUserId: 1 });
    console.log('[Migration 004] Created index on ratedUserId');

    // Index on raterId for fetching ratings given by user
    await collection.createIndex({ raterId: 1 });
    console.log('[Migration 004] Created index on raterId');

    // Index on tripGroupId for trip-specific queries
    await collection.createIndex({ tripGroupId: 1 });
    console.log('[Migration 004] Created index on tripGroupId');

    // Compound unique index to prevent duplicate ratings
    await collection.createIndex(
      { raterId: 1, ratedUserId: 1, tripGroupId: 1 },
      { unique: true }
    );
    console.log('[Migration 004] Created compound unique index on (raterId, ratedUserId, tripGroupId)');

    // Index on timestamps
    await collection.createIndex({ createdAt: 1 });
    await collection.createIndex({ updatedAt: 1 });
    console.log('[Migration 004] Created indexes on timestamps');

    // Index on isReported for moderation queries
    await collection.createIndex({ isReported: 1 });
    console.log('[Migration 004] Created index on isReported');

    console.log('[Migration 004] ✓ UserRating migration completed successfully');
  } catch (error) {
    console.error('[Migration 004] ✗ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('[Migration 004] Rolling back UserRating collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop collection
    await db.dropCollection('userratings');
    console.log('[Migration 004] ✓ UserRating collection dropped');
  } catch (error) {
    if ((error as any).code === 26) {
      console.log('[Migration 004] Collection does not exist, nothing to rollback');
    } else {
      console.error('[Migration 004] ✗ Rollback failed:', error);
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
