'use client';

import React, { useState } from 'react';
import '../../styles/design-system.css';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showHalfStars?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showHalfStars = false
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    small: 'text-base',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  const handleClick = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!readonly) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(null);
    }
  };

  const renderStar = (index: number) => {
    const displayRating = hoverRating !== null ? hoverRating : rating;
    const isFilled = index <= displayRating;
    const isHalfFilled = showHalfStars && !isFilled && index - 0.5 <= displayRating;

    return (
      <span
        key={index}
        className={`inline-block transition-all ${sizeClasses[size]} ${
          !readonly ? 'cursor-pointer hover:scale-110' : ''
        }`}
        style={{
          color: isFilled || isHalfFilled ? 'var(--color-warm-gold)' : 'var(--color-light-gray)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleClick(index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
      >
        {isHalfFilled ? '⯨' : '★'}
      </span>
    );
  };

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
    </div>
  );
};

export default StarRating;
