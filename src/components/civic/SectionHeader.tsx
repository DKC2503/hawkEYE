import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline shrink-0 focus-ring rounded-md p-1"
        >
          {actionLabel} &rarr;
        </button>
      )}
    </div>
  );
};
