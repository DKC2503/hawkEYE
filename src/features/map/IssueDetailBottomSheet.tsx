import React from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { IssueStatusBadge } from '../../components/civic/IssueStatusBadge';
import { SeverityIndicator } from '../../components/civic/SeverityIndicator';
import { LocationDisplay } from '../../components/civic/LocationDisplay';
import { IssueCategoryIcon } from '../../components/civic/IssueCategoryIcon';
import type { CivicIssue } from '../../types/civic';

interface IssueDetailBottomSheetProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IssueDetailBottomSheet: React.FC<IssueDetailBottomSheetProps> = ({
  issue,
  isOpen,
  onClose,
}) => {
  if (!issue) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Issue Details">
      <div className="space-y-4 text-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl glass-subtle text-amber-700 bg-amber-50 border-amber-200">
              <IssueCategoryIcon category={issue.category} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{issue.title}</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {issue.id}</p>
            </div>
          </div>
          <IssueStatusBadge status={issue.status} />
        </div>

        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          {issue.description}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl glass-subtle space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Location</span>
            <LocationDisplay location={issue.location} />
          </div>
          <div className="p-3 rounded-2xl glass-subtle space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Severity</span>
            <div>
              <SeverityIndicator severity={issue.severity} />
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/80">
          <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
          <span className="text-amber-800 font-bold">HawkEYE GIS Tracked</span>
        </div>
      </div>
    </BottomSheet>
  );
};
