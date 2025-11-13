/**
 * Test Data Seeding Script for Open Groups
 * Run this to create test data for testing the Open Groups feature
 */

import { connect } from '@/db/dbconfig';
import { TripRequest } from '@/models/TripRequest';
import { TripGroup } from '@/models/TripGroup';
import { UserPreferences } from '@/models/UserPreferences';
import { FoodPreferences } from '@/models/FoodPreferences';
import { UserRating } from '@/models/UserRating';

async function seedTestData() {
  try {
    await connect();
    console.log('Connected to database');

    // Create test users with preferences
    const testUsers = [
      {
        userId: 'test_user_1',
        lifestyle: {
          alcoholConsumption: 'occasional',
          smoking: 'non_smoker',
          activityLevel: 'moderate',
          sleepSchedule: 'flexible',
          budgetFlexibility: 'flexible',
          accommodationPreference: 'mid_range'
        },
        food: {
          dietaryRestrictions: ['vegetarian'],
          cuisinePreferences: ['italian', 'indian', 'thai'],
          allergies: null,
          avgMealBudget: 'moderate'
        }
      },
      {
        userId: 'test_user_2',
        lifestyle: {
          alcoholConsumption: 'occasional',
          smoking: 'non_smoker',
          activityLevel: 'moderate',
          sleepSchedule: 'early_riser',
          budgetFlexibility: 'flexible',
          accommodationPreference: 'mid_range'
        },
        food: {
          dietaryRestrictions: ['vegetarian', 'gluten_free'],
          cuisinePreferences: ['italian', 'mediterranean', 'thai'],
          allergies: null,
          avgMealBudget: 'moderate'
        }
      },
      {
        userId: 'test_user_3',
        lifestyle: {
          alcoholConsumption: 'regular',
          smoking: 'smoker',
          activityLevel: 'high_energy',
          sleepSchedule: 'night_owl',
          budgetFlexibility: 'open_ended',
          accommodationPreference: 'luxury'
        },
        food: {
          dietaryRestrictions: ['non_veg'],
          cuisinePreferences: ['american', 'mexican', 'japanese'],
          allergies: null,
          avgMealBudget: 'premium'
        }
      }
    ];

    // Create preferences for test users
    for (const user of testUsers) {
      await UserPreferences.findOneAndUpdate(
        { userId: user.userId },
        user.lifestyle,
        { upsert: true, new: true }
      );

      await FoodPreferences.findOneAndUpdate(
        { userId: user.userId },
        user.food,
        { upsert: true, new: true }
      );
    }

    console.log('✓ Created user preferences');

    // Create test trip requests
    const tripRequest1 = await TripRequest.create({
      userId: 'test_user_1',
      location: 'Tokyo, Japan',
      date_from: new Date('2024-06-01'),
      date_to: new Date('2024-06-10'),
      interests: ['culture', 'food', 'temples'],
      group_size_pref: { min: 2, max: 6 },
      status: 'open'
    });

    const tripRequest2 = await TripRequest.create({
      userId: 'test_user_2',
      location: 'Paris, France',
      date_from: new Date('2024-07-15'),
      date_to: new Date('2024-07-25'),
      interests: ['art', 'food', 'museums'],
      group_size_pref: { min: 2, max: 4 },
      status: 'open'
    });

    const tripRequest3 = await TripRequest.create({
      userId: 'test_user_3',
      location: 'Las Vegas, USA',
      date_from: new Date('2024-08-01'),
      date_to: new Date('2024-08-05'),
      interests: ['nightlife', 'entertainment', 'adventure'],
      group_size_pref: { min: 4, max: 8 },
      status: 'open'
    });

    console.log('✓ Created trip requests');

    // Create test trip groups
    const group1 = await TripGroup.create({
      groupId: 'test_group_1',
      tripRequestIds: [tripRequest1._id],
      members: ['test_user_1', 'test_user_2'],
      location: 'Tokyo, Japan',
      dateFrom: new Date('2024-06-01'),
      dateTo: new Date('2024-06-10')
    });

    const group2 = await TripGroup.create({
      groupId: 'test_group_2',
      tripRequestIds: [tripRequest2._id],
      members: ['test_user_2'],
      location: 'Paris, France',
      dateFrom: new Date('2024-07-15'),
      dateTo: new Date('2024-07-25')
    });

    const group3 = await TripGroup.create({
      groupId: 'test_group_3',
      tripRequestIds: [tripRequest3._id],
      members: ['test_user_3'],
      location: 'Las Vegas, USA',
      dateFrom: new Date('2024-08-01'),
      dateTo: new Date('2024-08-05')
    });

    console.log('✓ Created trip groups');

    // Create some test ratings
    await UserRating.create({
      raterId: 'test_user_1',
      ratedUserId: 'test_user_2',
      tripGroupId: group1._id,
      starRating: 5,
      feedback: 'Amazing travel companion! Very organized and fun to be around.'
    });

    await UserRating.create({
      raterId: 'test_user_2',
      ratedUserId: 'test_user_1',
      tripGroupId: group1._id,
      starRating: 4,
      feedback: 'Great person to travel with. Would definitely travel together again!'
    });

    console.log('✓ Created test ratings');

    console.log('\n✅ Test data seeded successfully!');
    console.log('\nTest Users Created:');
    console.log('- test_user_1 (Vegetarian, Moderate activity, Occasional drinker)');
    console.log('- test_user_2 (Vegetarian + Gluten-free, Moderate activity, Occasional drinker)');
    console.log('- test_user_3 (Non-veg, High energy, Regular drinker, Smoker)');
    console.log('\nTest Groups Created:');
    console.log('- Tokyo group (test_user_1, test_user_2) - High compatibility');
    console.log('- Paris group (test_user_2) - Medium compatibility');
    console.log('- Las Vegas group (test_user_3) - Low compatibility');

  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    process.exit();
  }
}

seedTestData();
