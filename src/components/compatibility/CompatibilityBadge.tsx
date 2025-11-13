'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface CompatibilityBreakdown {
  overall: number;
  lifestyle: number;
  food: number;
  accommodation: number;
  interests?: number;
  budget?: number;
  timing?: number;
}

interface CompatibilityBadgeProps {
  score: number;
  breakdown?: CompatibilityBreakdown;
  matchReasons?: string[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function CompatibilityBadge({
  score,
  breakdown,
  matchReasons = [],
  size = 'md',
  showTooltip = true,
}: CompatibilityBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 0.8) return { bg: '#9BA894', text: '#FFFFFF', label: 'Excellent Match' };
    if (score >= 0.6) return { bg: '#E8C547', text: '#3D3D3D', label: 'Good Match' };
    return { bg: '#B74B4B', text: '#FFFFFF', label: 'Fair Match' };
  };

  const color = getColor(score);
  const percentage = Math.round(score * 100);

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]}`}
        style={{
          background: color.bg,
          color: color.text,
        }}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
      >
        <span>{percentage}% Match</span>
        {showTooltip && breakdown && (
          <Info className="h-3 w-3 opacity-80" />
        )}
      </div>

      {/* Tooltip with breakdown */}
      {showDetails && showTooltip && breakdown && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-lg shadow-lg min-w-[280px]"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--color-light-gray)',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="mb-3">
            <h4
              className="font-semibold mb-1"
              style={{ color: 'var(--color-warm-brown)' }}
            >
              {color.label}
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Compatibility Breakdown
            </p>
          </div>

          <div className="space-y-2 mb-3">
            {breakdown.lifestyle !== undefined && (
              <CompatibilityBar
                label="Lifestyle"
                score={breakdown.lifestyle}
              />
            )}
            {breakdown.food !== undefined && (
              <CompatibilityBar label="Food" score={breakdown.food} />
            )}
            {breakdown.accommodation !== undefined && (
              <CompatibilityBar
                label="Accommodation"
                score={breakdown.accommodation}
              />
            )}
            {breakdown.interests !== undefined && (
              <CompatibilityBar
                label="Interests"
                score={breakdown.interests}
              />
            )}
            {breakdown.budget !== undefined && (
              <CompatibilityBar label="Budget" score={breakdown.budget} />
            )}
            {breakdown.timing !== undefined && (
              <CompatibilityBar label="Timing" score={breakdown.timing} />
            )}
          </div>

          {matchReasons.length > 0 && (
            <div className="pt-3" style={{ borderTop: '1px solid var(--color-light-gray)' }}>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Why you match:
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {matchReasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span style={{ color: 'var(--color-sage-green)' }}>✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompatibilityBar({ label, score }: { label: string; score: number }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.7 ? '#9BA894' : score >= 0.5 ? '#E8C547' : '#B74B4B';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{percentage}%</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
