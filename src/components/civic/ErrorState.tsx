import React from 'react';
import { GlassSurface } from '../ui/GlassSurface';
import { GlassButton } from '../ui/GlassButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'A network or system issue occurred while retrieving information.',
  onRetry,
}) => {
  return (
    <GlassSurface variant="subtle" rounded="2xl" className="p-6 text-center space-y-4 border-rose-200 bg-rose-50/70">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <GlassButton variant="danger" size="sm" onClick={onRetry}>
            Try Again
          </GlassButton>
        </div>
      )}
    </GlassSurface>
  );
};
