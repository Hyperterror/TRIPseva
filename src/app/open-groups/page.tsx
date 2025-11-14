'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Filter, Star } from 'lucide-react';
import CompatibilityBadge from '@/components/compatibility/CompatibilityBadge';
import '../../styles/design-system.css';

interface MemberInfo {
  userId: string;
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
}

interface GroupSuggestion {
  groupId: string;
  location: string;
  dateFrom: string;
  dateTo: string;
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

export default function OpenGroupsPage() {
  const [groups, setGroups] = useState<GroupSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [minCompatibility, setMinCompatibility] = useState(0.5); // Start at 50% for better discovery
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Lifestyle filters
  const [alcoholFilter, setAlcoholFilter] = useState<string>('');
  const [smokingFilter, setSmokingFilter] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('');
  
  // Dietary filters
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

  useEffect(() => {
    // Debounce the API call to prevent rapid requests
    const timeoutId = setTimeout(() => {
      fetchGroupSuggestions();
    }, 300); // Wait 300ms after user stops typing/changing filters

    return () => clearTimeout(timeoutId);
  }, [minCompatibility, locationFilter, alcoholFilter, smokingFilter, activityFilter, dietaryFilters]);

  const fetchGroupSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        minCompatibility: minCompatibility.toString(),
      });
      
      if (locationFilter) {
        params.append('location', locationFilter);
      }
      
      if (alcoholFilter) {
        params.append('alcohol', alcoholFilter);
      }
      
      if (smokingFilter) {
        params.append('smoking', smokingFilter);
      }
      
      if (activityFilter) {
        params.append('activityLevel', activityFilter);
      }
      
      if (dietaryFilters.length > 0) {
        params.append('dietary', dietaryFilters.join(','));
      }

      const response = await fetch(`/api/groups/suggestions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data.suggestions || []);
      } else {
        console.error('Failed to fetch group suggestions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching group suggestions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleDietaryFilter = (filter: string) => {
    setDietaryFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              Open Groups
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Find travel groups that match your preferences
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card-featured p-6 mb-6">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
              Filter Groups
            </h3>
            
            <div className="space-y-6">
              {/* Compatibility and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Minimum Compatibility
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minCompatibility}
                    onChange={(e) => setMinCompatibility(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {Math.round(minCompatibility * 100)}% or higher
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-sage-green)' }}
                  />
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-warm-brown)' }}>
                  Lifestyle Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Alcohol
                    </label>
                    <select
                      value={alcoholFilter}
                      onChange={(e) => setAlcoholFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-sage-green)' }}
                    >
                      <option value="">Any</option>
                      <option value="teetotaler">Teetotaler</option>
                      <option value="occasional">Occasional</option>
                      <option value="regular">Regular</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Smoking
                    </label>
                    <select
                      value={smokingFilter}
                      onChange={(e) => setSmokingFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-sage-green)' }}
                    >
                      <option value="">Any</option>
                      <option value="non_smoker">Non-smoker</option>
                      <option value="smoker">Smoker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Activity Level
                    </label>
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-sage-green)' }}
                    >
                      <option value="">Any</option>
                      <option value="relaxed">Relaxed</option>
                      <option value="moderate">Moderate</option>
                      <option value="high_energy">High Energy</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-warm-brown)' }}>
                  Dietary Restrictions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'halal', 'kosher'].map((diet) => (
                    <button
                      key={diet}
                      onClick={() => toggleDietaryFilter(diet)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        dietaryFilters.includes(diet)
                          ? 'text-white'
                          : 'bg-white'
                      }`}
                      style={{
                        background: dietaryFilters.includes(diet) ? 'var(--color-sage-green)' : 'white',
                        border: `1px solid var(--color-sage-green)`,
                        color: dietaryFilters.includes(diet) ? 'white' : 'var(--color-sage-green)'
                      }}
                    >
                      {diet.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setMinCompatibility(0.5);
                    setLocationFilter('');
                    setAlcoholFilter('');
                    setSmokingFilter('');
                    setActivityFilter('');
                    setDietaryFilters([]);
                  }}
                  className="text-sm"
                  style={{ color: 'var(--color-sage-green)' }}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" 
                 style={{ borderColor: 'var(--color-sage-green)' }}></div>
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
              Finding compatible groups...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && groups.length === 0 && (
          <div className="card-featured p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-sage-green)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              No compatible groups found
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Open Groups shows trips created by other users that match your preferences.
            </p>
            <div className="text-sm space-y-2" style={{ color: 'var(--text-tertiary)' }}>
              <p>💡 <strong>Tip:</strong> You won't see your own trips here - only trips created by others!</p>
              <p>Try:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Lowering the compatibility threshold</li>
                <li>Clearing filters</li>
                <li>Checking back later as more users create trips</li>
              </ul>
            </div>
          </div>
        )}

        {/* Group Listings */}
        {!loading && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.groupId} className="card-featured p-6 hover:scale-105 transition-transform">
                {/* Compatibility Badge */}
                <div className="mb-4">
                  <CompatibilityBadge
                    score={group.compatibility.overallScore}
                    breakdown={{
                      overall: group.compatibility.overallScore,
                      lifestyle: group.compatibility.breakdown.lifestyleMatch,
                      food: group.compatibility.breakdown.foodCompatibility,
                      accommodation: group.compatibility.breakdown.accommodationMatch,
                      interests: group.compatibility.breakdown.interestMatch,
                      budget: group.compatibility.breakdown.budgetMatch,
                      timing: group.compatibility.breakdown.timeOverlap
                    }}
                    matchReasons={group.compatibility.matchReasons}
                    size="md"
                  />
                </div>

                {/* Group Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--color-warm-brown)' }}>
                        {group.location}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(group.dateFrom)} - {formatDate(group.dateTo)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="h-4 w-4" />
                    <span>
                      {group.memberCount}/{group.maxMembers} members
                    </span>
                  </div>

                  {/* Interests */}
                  {group.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {group.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: 'var(--color-sage-green)',
                            color: 'white'
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                      {group.interests.length > 3 && (
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          +{group.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Match Reasons */}
                  {group.compatibility.matchReasons.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-sage-green-light)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-warm-brown)' }}>
                        Why you match:
                      </p>
                      <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        {group.compatibility.matchReasons.slice(0, 2).map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Member Ratings */}
                  {group.memberInfo && group.memberInfo.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-sage-green-light)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-warm-brown)' }}>
                        Group Members:
                      </p>
                      <div className="space-y-2">
                        {group.memberInfo.slice(0, 3).map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Member {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {member.averageRating > 0 ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium" style={{ color: 'var(--color-warm-brown)' }}>
                                      {member.averageRating.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    ({member.totalRatings} {member.totalRatings === 1 ? 'rating' : 'ratings'})
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  No ratings yet
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {group.memberInfo.length > 3 && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            +{group.memberInfo.length - 3} more member{group.memberInfo.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  className="btn-primary w-full mt-4"
                  onClick={() => {
                    // TODO: Implement join group functionality
                    console.log('Join group:', group.groupId);
                  }}
                >
                  View Group
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
