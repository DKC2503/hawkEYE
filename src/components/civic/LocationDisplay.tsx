import React from 'react';
import type { LocationCoordinates } from '../../types/civic';

interface LocationDisplayProps {
  location?: LocationCoordinates;
  placeholder?: string;
  compact?: boolean;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  placeholder = 'Location not specified',
  compact = false,
}) => {
  if (!location) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{placeholder}</span>
      </div>
    );
  }

  const text = location.addressPlaceholder || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
      <svg className="w-4 h-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className={compact ? 'truncate max-w-[200px]' : ''}>{text}</span>
    </div>
  );
};
