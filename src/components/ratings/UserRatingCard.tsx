'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import '../../styles/design-system.css';

interface UserRatingCardProps {
  ratingId: string;
  raterName: string;
  raterProfileImg?: string;
  starRating: number;
  feedback: string;
  createdAt: string;
  isOwner: boolean;
  canEdit: boolean;
  onEdit?: () => void;
  onReport?: () => void;
}

const UserRatingCard: React.FC<UserRatingCardProps> = ({
  ratingId,
  raterName,
  raterProfileImg,
  starRating,
  feedback,
  createdAt,
  isOwner,
  canEdit,
  onEdit,
  onReport
}) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setReporting(true);
    try {
      const response = await fetch(`/api/ratings/${ratingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      });

      if (!response.ok) {
        throw new Error('Failed to report rating');
      }

      alert('Rating reported successfully. Our team will review it.');
      setShowReportDialog(false);
      if (onReport) onReport();
    } catch (error) {
      alert('Failed to report rating. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        background: 'var(--bg-card)',
        border: '1px solid var(--color-light-gray)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Profile Image */}
          <div 
            className="w-12 h-12 rounded-full overflow-hidden"
            style={{ border: '2px solid var(--color-soft-terracotta)' }}
          >
            {raterProfileImg ? (
              <img
                src={raterProfileImg}
                alt={raterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'var(--color-light-gray)', color: 'var(--text-secondary)' }}
              >
                {raterName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Date */}
          <div>
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {raterName}
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwner && canEdit && onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 rounded-md text-sm font-semibold"
              style={{ 
                background: 'var(--color-dusty-blue)',
                color: 'white'
              }}
            >
              Edit
            </button>
          )}
          {!isOwner && (
            <button
              onClick={() => setShowReportDialog(true)}
              className="px-3 py-1 rounded-md text-sm font-semibold"
              style={{ 
                background: 'rgba(183, 75, 75, 0.1)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error)'
              }}
            >
              Report
            </button>
          )}
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-3">
        <StarRating rating={starRating} readonly size="medium" />
      </div>

      {/* Feedback */}
      <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {feedback}
      </p>

      {/* Report Dialog */}
      {showReportDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowReportDialog(false)}
        >
          <div 
            className="card-featured max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
              Report Rating
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Please provide a reason for reporting this rating:
            </p>
            <textarea
              className="input mb-4"
              placeholder="Describe why this rating should be reviewed..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportDialog(false)}
                className="btn-secondary flex-1"
                disabled={reporting}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="btn-primary flex-1"
                disabled={reporting || !reportReason.trim()}
              >
                {reporting ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRatingCard;
