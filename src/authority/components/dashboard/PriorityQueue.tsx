import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface PriorityQueueProps {
  issues: AuthorityIssueInspectionItem[];
  onSelectIssue: (issue: AuthorityIssueInspectionItem) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({ issues, onSelectIssue }) => {
  return (
    <div className="auth-glass-surface rounded-2xl p-6 space-y-4 border border-slate-800/80">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Priority Action Triage Queue
          </h3>
          <p className="text-xs text-slate-400">
            Citizen reports requiring authority verification and work order allocation.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
          {issues.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => onSelectIssue(issue)}
            className="p-4 rounded-xl auth-glass-subtle hover:bg-white/5 border border-slate-800/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-3 min-w-0">
              {issue.imageUrl ? (
                <img
                  src={issue.imageUrl}
                  alt={issue.ticketId}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500 font-mono shrink-0">
                  NO IMG
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {issue.ticketId}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                    issue.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : issue.severity === 'high'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {issue.location.area || issue.location.city}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                  {issue.description}
                </h4>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>AI Confidence: <strong className="text-emerald-400">{(issue.aiAnalysis.confidence * 100).toFixed(0)}%</strong></span>
                  <span>•</span>
                  <span>Submitted: {new Date(issue.reporter.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Inspect Report</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
