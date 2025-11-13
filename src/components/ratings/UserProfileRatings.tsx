'use client';

import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import UserRatingCard from './UserRatingCard';
import '../../styles/design-system.css';

interface Rating {
  _id: string;
  raterId: string;
  raterName: string;
  raterProfileImg?: string;
  starRating: number;
  feedback: string;
  createdAt: string;
  canEdit: boolean;
}

interface UserProfileRatingsProps {
  userId: string;
  isOwnProfile?: boolean;
}

const UserProfileRatings: React.FC<UserProfileRatingsProps> = ({
  userId,
  isOwnProfile = false
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

  useEffect(() => {
    fetchRatings();
  }, [userId, currentPage, sortBy]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/ratings/user/${userId}?page=${currentPage}&limit=10`
      );

      if (!response.ok) {
        // If user not found or no ratings, just show empty state
        if (response.status === 404) {
          setRatings([]);
          setAverageRating(0);
          setTotalRatings(0);
          setRatingDistribution([0, 0, 0, 0, 0]);
          setTotalPages(1);
          return;
        }
        throw new Error('Failed to fetch ratings');
      }

      const result = await response.json();
      
      setRatings(result.data || []);
      setAverageRating(result.summary?.averageRating || 0);
      setTotalRatings(result.summary?.totalRatings || 0);
      setRatingDistribution(result.summary?.ratingDistribution || [0, 0, 0, 0, 0]);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError('Unable to load ratings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderRatingDistribution = () => {
    const maxCount = Math.max(...ratingDistribution);
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star - 1] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-semibold w-8" style={{ color: 'var(--text-secondary)' }}>
                {star} ★
              </span>
              <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--color-light-gray)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: 'var(--gradient-button-primary)'
                  }}
                ></div>
              </div>
              <span className="text-sm w-12 text-right" style={{ color: 'var(--text-tertiary)' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <div className="space-y-6">
        <div className="card-featured animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="card-featured p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-3">
              <StarRating rating={averageRating} readonly showHalfStars size="large" />
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
              Rating Distribution
            </h4>
            {renderRatingDistribution()}
          </div>
        </div>
      </div>

      {/* No Ratings State */}
      {totalRatings === 0 && !loading && (
        <div className="text-center p-12" style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--color-light-gray)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
            No Ratings Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isOwnProfile 
              ? "Complete trips to receive ratings from your travel companions."
              : "This traveler hasn't received any ratings yet."}
          </p>
        </div>
      )}

      {/* Ratings List */}
      {totalRatings > 0 && (
        <>
          {/* Sort Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
              Reviews ({totalRatings})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={sortBy === 'recent' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('highest')}
                className={sortBy === 'highest' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Highest
              </button>
              <button
                onClick={() => setSortBy('lowest')}
                className={sortBy === 'lowest' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Lowest
              </button>
            </div>
          </div>

          {/* Rating Cards */}
          <div className="space-y-4">
            {ratings.map((rating) => (
              <UserRatingCard
                key={rating._id}
                ratingId={rating._id}
                raterName={rating.raterName}
                raterProfileImg={rating.raterProfileImg}
                starRating={rating.starRating}
                feedback={rating.feedback}
                createdAt={rating.createdAt}
                isOwner={false}
                canEdit={rating.canEdit}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 rounded-lg" style={{ 
          background: 'rgba(183, 75, 75, 0.1)', 
          border: '1px solid var(--status-error)',
          color: 'var(--status-error)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <h4 className="font-semibold">Error Loading Ratings</h4>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchRatings}
            className="btn-secondary mt-4"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileRatings;
