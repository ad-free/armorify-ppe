// src/components/catalog/StarRating.tsx
import React, { useState } from 'react';

interface Props {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  readOnly?: boolean;
  onChange?: (n: number) => void;
}

export const StarRating: React.FC<Props> = ({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  readOnly = false,
  onChange,
}) => {
  const effectiveInteractive = interactive && !readOnly;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const sizeClass = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!effectiveInteractive || !onChange) return;
    if (e.key === 'Enter' || e.key === ' ') {
      onChange(index + 1);
    } else if (e.key === 'ArrowRight') {
      onChange(Math.min(max, (index + 1) + 1));
    } else if (e.key === 'ArrowLeft') {
      onChange(Math.max(1, (index + 1) - 1));
    }
  };

  return (
    <div
      className={`flex items-center gap-1 ${effectiveInteractive ? 'cursor-pointer' : ''}`}
      aria-label={`Đánh giá ${value} trên ${max} sao`}
      role={effectiveInteractive ? 'slider' : 'img'}
      aria-valuemin={1}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={effectiveInteractive ? 0 : undefined}
      onMouseLeave={() => setHoverIndex(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const fill = interactive
          ? (hoverIndex !== null ? (i <= hoverIndex ? 1 : 0) : (i < value ? 1 : 0))
          : (value - i >= 1 ? 1 : value - i >= 0.5 ? 0.5 : 0);

        return (
          <div
            key={i}
            className={`relative ${sizeClass} text-yellow-400`}
            onMouseEnter={() => interactive && setHoverIndex(i)}
            onClick={() => interactive && onChange && onChange(i + 1)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            tabIndex={interactive ? -1 : undefined}
          >
            <svg
              className="absolute top-0 left-0 w-full h-full text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {fill > 0 && (
              <svg
                className="absolute top-0 left-0 w-full h-full text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};
