'use client';

import React, { useState } from 'react';
import RatingForm from './RatingForm';
import '../../styles/design-system.css';

interface TripMember {
  userId: string;
  name: string;
  profileImg?: string;
}

interface PostTripRatingPromptProps {
  tripGroupId: string;
  tripName: string;
  members: TripMember[];
  onClose?: () => void;
}

const PostTripRatingPrompt: React.FC<PostTripRatingPromptProps> = ({
  tripGroupId,
  tripName,
  members,
  onClose
}) => {
  const [ratedMembers, setRatedMembers] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const handleRateClick = (member: TripMember) => {
    setSelectedMember(member);
    setShowRatingForm(true);
  };

  const handleRatingSuccess = () => {
    if (selectedMember) {
      setRatedMembers(prev => new Set([...prev, selectedMember.userId]));
    }
    setShowRatingForm(false);
    setSelectedMember(null);
  };

  const handleRatingCancel = () => {
    setShowRatingForm(false);
    setSelectedMember(null);
  };

  const unratedMembers = members.filter(m => !ratedMembers.has(m.userId));
  const allRated = unratedMembers.length === 0;

  if (allRated && onClose) {
    // Auto-close when all members are rated
    setTimeout(() => onClose(), 2000);
  }

  return (
    <>
      {/* Main Prompt Card */}
      {!showRatingForm && (
        <div 
          className="card-featured p-6"
          style={{ 
            border: '2px solid var(--color-warm-gold)',
            background: 'linear-gradient(135deg, #FFFCF7 0%, #FFF8E7 100%)'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⭐</span>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-warm-brown)' }}>
                  Rate Your Travel Companions
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Trip: {tripName}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-2xl"
                style={{ color: 'var(--text-tertiary)' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Success Message */}
          {allRated ? (
            <div 
              className="text-center p-6 rounded-lg"
              style={{ 
                background: 'rgba(155, 168, 148, 0.1)',
                border: '1px solid var(--status-success)'
              }}
            >
              <div className="text-5xl mb-3">✓</div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--status-success)' }}>
                All Ratings Complete!
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Thank you for rating your travel companions.
              </p>
            </div>
          ) : (
            <>
              {/* Description */}
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Help future travelers by sharing your experience with your trip companions.
                Your ratings help build a trusted community.
              </p>

              {/* Member List */}
              <div className="space-y-3">
                {members.map((member) => {
                  const isRated = ratedMembers.has(member.userId);
                  
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ 
                        background: isRated ? 'rgba(155, 168, 148, 0.1)' : 'var(--bg-secondary)',
                        border: `1px solid ${isRated ? 'var(--status-success)' : 'var(--color-light-gray)'}`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Profile Image */}
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden"
                          style={{ border: '2px solid var(--color-soft-terracotta)' }}
                        >
                          {member.profileImg ? (
                            <img
                              src={member.profileImg}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-lg font-bold"
                              style={{ background: 'var(--color-light-gray)', color: 'var(--text-secondary)' }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {member.name}
                          </h4>
                          {isRated && (
                            <p className="text-sm" style={{ color: 'var(--status-success)' }}>
                              ✓ Rated
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      {isRated ? (
                        <span 
                          className="px-4 py-2 rounded-md text-sm font-semibold"
                          style={{ 
                            background: 'var(--status-success)',
                            color: 'white'
                          }}
                        >
                          ✓ Rated
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRateClick(member)}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          Rate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-4 text-center">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {ratedMembers.size} of {members.length} rated
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && selectedMember && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleRatingCancel}
        >
          <div 
            className="card-featured max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <RatingForm
              ratedUserId={selectedMember.userId}
              ratedUserName={selectedMember.name}
              tripGroupId={tripGroupId}
              onSuccess={handleRatingSuccess}
              onCancel={handleRatingCancel}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PostTripRatingPrompt;
