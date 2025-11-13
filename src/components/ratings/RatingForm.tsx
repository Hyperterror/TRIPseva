'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import '../../styles/design-system.css';

interface RatingFormProps {
  ratedUserId: string;
  ratedUserName: string;
  tripGroupId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({
  ratedUserId,
  ratedUserName,
  tripGroupId,
  onSuccess,
  onCancel
}) => {
  const [starRating, setStarRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = starRating > 0 && feedback.length >= 20 && feedback.length <= 500;
  const charCount = feedback.length;
  const minChars = 20;
  const maxChars = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Please provide a rating and at least 20 characters of feedback.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratedUserId,
          tripGroupId,
          starRating,
          feedback
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
          Rate <span style={{ color: 'var(--color-soft-terracotta)' }}>{ratedUserName}</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Share your experience traveling together
        </p>
      </div>

      {/* Star Rating */}
      <div className="text-center">
        <label className="preference-label mb-4">How would you rate this traveler?</label>
        <div className="flex justify-center">
          <StarRating
            rating={starRating}
            onRatingChange={setStarRating}
            size="large"
          />
        </div>
        {starRating > 0 && (
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {starRating} {starRating === 1 ? 'star' : 'stars'}
          </p>
        )}
      </div>

      {/* Feedback Textarea */}
      <div>
        <label className="preference-label">Your Feedback</label>
        <textarea
          className="input"
          placeholder="Share your experience traveling with this person. What made them a great (or not so great) travel companion?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          maxLength={maxChars}
          style={{ resize: 'vertical', minHeight: '120px' }}
        />
        <div className="flex justify-between items-center mt-2">
          <span 
            className="text-sm"
            style={{ 
              color: charCount < minChars 
                ? 'var(--status-error)' 
                : charCount > maxChars - 50 
                ? 'var(--status-warning)' 
                : 'var(--text-tertiary)' 
            }}
          >
            {charCount < minChars 
              ? `${minChars - charCount} more characters needed` 
              : `${charCount}/${maxChars} characters`}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg" style={{ 
          background: 'rgba(183, 75, 75, 0.1)', 
          border: '1px solid var(--status-error)',
          color: 'var(--status-error)'
        }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={!isValid || loading}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </form>
  );
};

export default RatingForm;
