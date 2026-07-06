import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { IssueStatusBadge } from '../../components/civic/IssueStatusBadge';
import { SeverityIndicator } from '../../components/civic/SeverityIndicator';
import { LocationDisplay } from '../../components/civic/LocationDisplay';
import { IssueCategoryIcon } from '../../components/civic/IssueCategoryIcon';
import type { CivicIssue } from '../../types/civic';

interface DesktopIssuePanelProps {
  issue: CivicIssue | null;
  onClose: () => void;
}

export const DesktopIssuePanel: React.FC<DesktopIssuePanelProps> = ({
  issue,
  onClose,
}) => {
  if (!issue) return null;

  return (
    <GlassSurface
      variant="elevated"
      rounded="3xl"
      className="hidden md:flex flex-col w-80 lg:w-96 p-6 space-y-4 shadow-xl border-slate-200/90 bg-white/95 text-slate-900 max-h-full overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl glass-subtle text-amber-700 bg-amber-50 border-amber-200">
            <IssueCategoryIcon category={issue.category} className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-mono">ID: {issue.id}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close side panel"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-ring"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">{issue.title}</h3>
        <div className="flex items-center gap-2 pt-1">
          <IssueStatusBadge status={issue.status} size="sm" />
          <SeverityIndicator severity={issue.severity} />
        </div>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        {issue.description}
      </p>

      <div className="p-3 rounded-2xl glass-subtle space-y-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase">Location</span>
        <LocationDisplay location={issue.location} />
      </div>

      <div className="pt-2 text-xs text-slate-500 border-t border-slate-200/80 flex justify-between">
        <span>Reported {new Date(issue.createdAt).toLocaleDateString()}</span>
        <span className="text-amber-800 font-bold">HawkEYE GIS</span>
      </div>
    </GlassSurface>
  );
};
