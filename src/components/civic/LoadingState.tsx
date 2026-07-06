import React from 'react';
import { GlassSurface } from '../ui/GlassSurface';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading civic data...',
  rows = 3,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-600">
        <svg className="w-5 h-5 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>{message}</span>
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <GlassSurface key={i} variant="subtle" rounded="2xl" className="p-4 space-y-3 animate-pulse bg-white/70">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/5" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </GlassSurface>
        ))}
      </div>
    </div>
  );
};
