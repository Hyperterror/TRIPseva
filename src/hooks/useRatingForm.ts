import { useState, useCallback } from 'react';
import axios from 'axios';

interface RatingFormData {
  ratedUserId: string;
  tripGroupId: string;
  starRating: number;
  feedback: string;
}

interface UseRatingFormReturn {
  starRating: number;
  feedback: string;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  setStarRating: (rating: number) => void;
  setFeedback: (feedback: string) => void;
  submitRating: (ratedUserId: string, tripGroupId: string) => Promise<void>;
  reset: () => void;
}

const MIN_FEEDBACK_LENGTH = 20;
const MAX_FEEDBACK_LENGTH = 500;

export const useRatingForm = (): UseRatingFormReturn => {
  const [starRating, setStarRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation
  const isValid = 
    starRating >= 1 && 
    starRating <= 5 && 
    feedback.trim().length >= MIN_FEEDBACK_LENGTH &&
    feedback.trim().length <= MAX_FEEDBACK_LENGTH;

  const submitRating = useCallback(async (ratedUserId: string, tripGroupId: string) => {
    if (!isValid) {
      setError('Please provide a valid rating (1-5 stars) and feedback (20-500 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const data: RatingFormData = {
        ratedUserId,
        tripGroupId,
        starRating,
        feedback: feedback.trim()
      };

      await axios.post('/api/ratings', data);
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setStarRating(0);
        setFeedback('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setError(
        err.response?.data?.error || 
        'Failed to submit rating. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [starRating, feedback, isValid]);

  const reset = useCallback(() => {
    setStarRating(0);
    setFeedback('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  }, []);

  return {
    starRating,
    feedback,
    isValid,
    isSubmitting,
    error,
    success,
    setStarRating,
    setFeedback,
    submitRating,
    reset
  };
};
