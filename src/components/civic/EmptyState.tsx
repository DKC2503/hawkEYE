import React from 'react';
import { GlassSurface } from '../ui/GlassSurface';
import { GlassButton } from '../ui/GlassButton';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <GlassSurface variant="subtle" rounded="2xl" className="p-8 text-center space-y-4 max-w-md mx-auto border-slate-200/80 bg-white/70">
      <div className="w-14 h-14 rounded-2xl glass-elevated text-slate-500 flex items-center justify-center mx-auto shadow-sm border border-slate-200/80">
        {icon || (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <GlassButton variant="accent" size="sm" onClick={onAction}>
            {actionLabel}
          </GlassButton>
        </div>
      )}
    </GlassSurface>
  );
};
