import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Rating {
  _id: string;
  raterId: string;
  raterName: string;
  raterProfileImg?: string;
  starRating: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface UseUserRatingsReturn {
  ratings: Rating[];
  summary: RatingSummary | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchRatings: (page?: number) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

export const useUserRatings = (
  userId: string | null,
  initialPage: number = 1,
  limit: number = 10
): UseUserRatingsReturn => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchRatings = useCallback(async (page: number = currentPage) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/ratings/user/${userId}`, {
        params: { page, limit }
      });

      setRatings(response.data.ratings);
      setSummary({
        averageRating: response.data.averageRating,
        totalRatings: response.data.totalRatings,
        distribution: response.data.distribution || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      });
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setHasMore(response.data.hasMore);
    } catch (err: any) {
      console.error('Error fetching ratings:', err);
      setError(err.response?.data?.error || 'Failed to fetch ratings');
      setRatings([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage, limit]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchRatings(newPage);
    }
  }, [currentPage, hasMore, fetchRatings]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchRatings(newPage);
    }
  }, [currentPage, fetchRatings]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    ratings,
    summary,
    loading,
    error,
    currentPage,
    totalPages,
    hasMore,
    fetchRatings,
    nextPage,
    prevPage
  };
};
