/**
 * Migration: Create ItineraryRestaurants Collection
 * Creates the itinerary_restaurants collection with compound indexes
 */

import mongoose from 'mongoose';
import { connect } from '../dbconfig';

export async function up() {
  console.log('[Migration 003] Creating ItineraryRestaurants collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'itineraryrestaurants' }).toArray();
    
    if (collections.length > 0) {
      console.log('[Migration 003] ItineraryRestaurants collection already exists');
      return;
    }

    // Create collection
    await db.createCollection('itineraryrestaurants');
    console.log('[Migration 003] ItineraryRestaurants collection created');

    // Create indexes
    const collection = db.collection('itineraryrestaurants');
    
    // Index on itineraryId for queries
    await collection.createIndex({ itineraryId: 1 });
    console.log('[Migration 003] Created index on itineraryId');

    // Compound index for efficient day/meal queries
    await collection.createIndex(
      { itineraryId: 1, dayNumber: 1, mealSlot: 1 },
      { unique: true }
    );
    console.log('[Migration 003] Created compound index on (itineraryId, dayNumber, mealSlot)');

    // Index on timestamps
    await collection.createIndex({ createdAt: 1 });
    await collection.createIndex({ updatedAt: 1 });
    console.log('[Migration 003] Created indexes on timestamps');

    console.log('[Migration 003] ✓ ItineraryRestaurants migration completed successfully');
  } catch (error) {
    console.error('[Migration 003] ✗ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('[Migration 003] Rolling back ItineraryRestaurants collection...');
  
  try {
    await connect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop collection
    await db.dropCollection('itineraryrestaurants');
    console.log('[Migration 003] ✓ ItineraryRestaurants collection dropped');
  } catch (error) {
    if ((error as any).code === 26) {
      console.log('[Migration 003] Collection does not exist, nothing to rollback');
    } else {
      console.error('[Migration 003] ✗ Rollback failed:', error);
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
