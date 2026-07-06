import React from 'react';
import { GlassSurface } from '../ui/GlassSurface';
import { IssueStatusBadge } from './IssueStatusBadge';
import { IssueCategoryIcon } from './IssueCategoryIcon';
import { SeverityIndicator } from './SeverityIndicator';
import { LocationDisplay } from './LocationDisplay';
import type { CivicIssue } from '../../types/civic';

interface IssueCardProps {
  issue: CivicIssue;
  onClick?: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  return (
    <GlassSurface
      variant="surface"
      rounded="2xl"
      interactive={!!onClick}
      onClick={onClick}
      className="p-4 space-y-3 border-slate-200/80 hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl glass-subtle text-sky-700 bg-sky-50 border-sky-100 shrink-0">
            <IssueCategoryIcon category={issue.category} className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
              {issue.title}
            </h4>
            <span className="text-[11px] text-slate-500">
              Reported {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <IssueStatusBadge status={issue.status} size="sm" />
      </div>

      <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
        {issue.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2 flex-wrap">
        <LocationDisplay location={issue.location} compact />
        <SeverityIndicator severity={issue.severity} />
      </div>
    </GlassSurface>
  );
};
