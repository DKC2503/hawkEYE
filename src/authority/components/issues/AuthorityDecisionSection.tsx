import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface AuthorityDecisionSectionProps {
  issue: AuthorityIssueInspectionItem;
}

export const AuthorityDecisionSection: React.FC<AuthorityDecisionSectionProps> = ({ issue }) => {
  return (
    <div className="space-y-3 p-4 rounded-xl auth-glass-subtle border border-amber-500/30 bg-amber-950/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
          Municipal Authority Decision Control
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Stage Foundation (Actions Prepared)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled
          className="py-2.5 px-4 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold opacity-60 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          title="Accept & Dispatch Work Order (Prepared for live stage)"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Accept & Create Work Order</span>
        </button>

        <button
          type="button"
          disabled
          className="py-2.5 px-4 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold opacity-60 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          title="Dismiss / Reject Invalid Report (Prepared for live stage)"
        >
          <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Dismiss as Invalid Report</span>
        </button>
      </div>

      {issue.assignedWorkerName && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span>Assigned Municipal Crew:</span>
          <span className="font-bold text-amber-400 font-mono">{issue.assignedWorkerName}</span>
        </div>
      )}
    </div>
  );
};
