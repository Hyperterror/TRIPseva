/**
 * Group Suggestions API with Enhanced Compatibility
 * Returns open groups with compatibility scores and match reasons
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/db/dbconfig';
import { TripGroup } from '@/models/TripGroup';
import { TripRequest } from '@/models/TripRequest';
import { UserPreferences } from '@/models/UserPreferences';
import { FoodPreferences } from '@/models/FoodPreferences';
import { CompatibilityService } from '@/services/CompatibilityService';
import { ratingService } from '@/services/RatingService';
import { logger } from '@/lib/logger';

const compatibilityService = new CompatibilityService();

interface MemberInfo {
  userId: string;
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
}

interface GroupSuggestion {
  groupId: string;
  location: string;
  dateFrom: Date;
  dateTo: Date;
  members: string[];
  memberCount: number;
  maxMembers: number;
  interests: string[];
  memberInfo: MemberInfo[];
  compatibility: {
    overallScore: number;
    breakdown: {
      interestMatch: number;
      budgetMatch: number;
      timeOverlap: number;
      lifestyleMatch: number;
      foodCompatibility: number;
      accommodationMatch: number;
    };
    matchReasons: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connect();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const minCompatibility = parseFloat(searchParams.get('minCompatibility') || '0.6');
    const location = searchParams.get('location');
    const interests = searchParams.get('interests')?.split(',');
    
    // Lifestyle filters
    const alcoholFilter = searchParams.get('alcohol');
    const smokingFilter = searchParams.get('smoking');
    const activityFilter = searchParams.get('activityLevel');
    
    // Dietary filters
    const dietaryFilter = searchParams.get('dietary')?.split(',');

    // Fetch user's preferences
    const [userLifestylePrefs, userFoodPrefs] = await Promise.all([
      UserPreferences.findOne({ userId }),
      FoodPreferences.findOne({ userId })
    ]);

    // Find open trip requests (not yet in a group or group not full)
    const openTrips = await TripRequest.find({
      status: 'open',
      userId: { $ne: userId } // Exclude user's own trips
    }).lean();

    if (openTrips.length === 0) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    // Get groups for these trips
    const tripIds = openTrips.map(trip => trip._id);
    const groups = await TripGroup.find({
      tripRequestIds: { $in: tripIds },
      members: { $ne: userId } // Exclude groups user is already in
    }).lean();

    // Calculate compatibility for each group
    const suggestions: GroupSuggestion[] = [];

    for (const group of groups) {
      // Skip if group is full (assuming max 6 members)
      if (group.members.length >= 6) continue;

      // Filter by location if specified
      if (location && group.location !== location) continue;

      // Calculate compatibility with group members and fetch ratings
      const compatibilityScores = [];
      const allMatchReasons: string[] = [];
      const memberInfo: MemberInfo[] = [];
      let skipGroup = false;

      for (const memberId of group.members) {
        // Fetch member preferences
        const [memberLifestylePrefs, memberFoodPrefs] = await Promise.all([
          UserPreferences.findOne({ userId: memberId }),
          FoodPreferences.findOne({ userId: memberId })
        ]);

        // Apply lifestyle filters (only if filter is set AND member has preferences)
        if (alcoholFilter && memberLifestylePrefs?.alcoholConsumption && 
            memberLifestylePrefs.alcoholConsumption !== alcoholFilter) {
          skipGroup = true;
          break;
        }
        
        if (smokingFilter && memberLifestylePrefs?.smoking && 
            memberLifestylePrefs.smoking !== smokingFilter) {
          skipGroup = true;
          break;
        }
        
        if (activityFilter && memberLifestylePrefs?.activityLevel && 
            memberLifestylePrefs.activityLevel !== activityFilter) {
          skipGroup = true;
          break;
        }
        
        // Apply dietary filters (only if filter is set AND member has preferences)
        if (dietaryFilter && dietaryFilter.length > 0 && memberFoodPrefs?.dietaryRestrictions) {
          const hasMatchingDiet = dietaryFilter.some(diet =>
            memberFoodPrefs.dietaryRestrictions.includes(diet)
          );
          if (!hasMatchingDiet) {
            skipGroup = true;
            break;
          }
        }

        // Calculate compatibility
        // If either user has no preferences, use a default score of 0.7 (70%)
        let compatibilityScore = 0.7; // Default neutral score
        let matchReasons: string[] = [];

        if (userLifestylePrefs || userFoodPrefs || memberLifestylePrefs || memberFoodPrefs) {
          try {
            const compatibility = compatibilityService.calculateCompatibility(
              {
                lifestyle: userLifestylePrefs || null,
                food: userFoodPrefs || null
              },
              {
                lifestyle: memberLifestylePrefs || null,
                food: memberFoodPrefs || null
              }
            );
            compatibilityScore = compatibility.score;
            matchReasons = compatibility.matchReasons || [];
          } catch (error) {
            console.error('Compatibility calculation error:', error);
            // Keep default score of 0.7
          }
        }

        compatibilityScores.push(compatibilityScore);
        
        // Collect match reasons
        if (matchReasons.length > 0) {
          allMatchReasons.push(...matchReasons);
        }
        
        // Fetch member rating summary
        const ratingSummary = await ratingService.getUserRatingSummary(memberId);
        memberInfo.push({
          userId: memberId,
          averageRating: ratingSummary.averageRating,
          totalRatings: ratingSummary.totalRatings,
          totalTrips: 0 // TODO: Calculate actual trips completed
        });
      }

      // Skip this group if filters didn't match
      if (skipGroup) continue;

      // Calculate average compatibility with group
      const avgCompatibility = compatibilityScores.length > 0
        ? compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length
        : 0.7; // Default to 70% if no scores

      // Filter by minimum compatibility
      if (avgCompatibility < minCompatibility) continue;

      // Get trip details for interests
      const tripRequest = openTrips.find(trip => 
        group.tripRequestIds.some(id => id.toString() === (trip._id as any).toString())
      );

      // Filter by interests if specified
      if (interests && tripRequest) {
        const hasMatchingInterest = interests.some(interest => 
          tripRequest.interests?.includes(interest)
        );
        if (!hasMatchingInterest) continue;
      }

      // Create suggestion
      suggestions.push({
        groupId: group.groupId,
        location: group.location,
        dateFrom: group.dateFrom,
        dateTo: group.dateTo,
        members: group.members,
        memberCount: group.members.length,
        maxMembers: 6,
        interests: tripRequest?.interests || [],
        memberInfo,
        compatibility: {
          overallScore: avgCompatibility,
          breakdown: {
            interestMatch: 0.8, // TODO: Calculate from actual interests
            budgetMatch: 0.7, // TODO: Calculate from actual budget
            timeOverlap: 1.0, // Same dates
            lifestyleMatch: avgCompatibility * 0.4, // Approximate
            foodCompatibility: avgCompatibility * 0.3, // Approximate
            accommodationMatch: avgCompatibility * 0.3 // Approximate
          },
          matchReasons: [...new Set(allMatchReasons)].slice(0, 3) // Top 3 unique reasons
        }
      });
    }

    // Sort by compatibility score (highest first)
    suggestions.sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore);

    logger.info('Group suggestions fetched', {
      userId,
      suggestionsCount: suggestions.length,
      minCompatibility
    });

    return NextResponse.json(
      { suggestions },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Group suggestions error', error as Error, { userId: (await auth()).userId });
    return NextResponse.json(
      { error: 'Failed to fetch group suggestions' },
      { status: 500 }
    );
  }
}
