import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface AuthorityIssueCardProps {
  issue: AuthorityIssueInspectionItem;
  onSelect: (issue: AuthorityIssueInspectionItem) => void;
}

export const AuthorityIssueCard: React.FC<AuthorityIssueCardProps> = ({ issue, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(issue)}
      className="auth-glass-surface rounded-2xl p-5 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-3 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
            {issue.ticketId}
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            #{issue.markerNumber}
          </span>
        </div>

        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded uppercase ${
            issue.severity === 'critical'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : issue.severity === 'high'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {issue.severity}
        </span>
      </div>

      <div className="flex items-start gap-3">
        {issue.imageUrl && (
          <img
            src={issue.imageUrl}
            alt={issue.ticketId}
            className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0"
          />
        )}
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1 capitalize">
            {issue.category}: {issue.description}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {issue.location.displayName || issue.location.area}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 font-mono">
            <span>Neural Verdict: <strong className="text-emerald-400">{issue.aiAnalysis.category}</strong></span>
            <span>•</span>
            <span>Confidence: <strong className="text-emerald-400">{(issue.aiAnalysis.confidence * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-mono text-[11px]">
          Status: <strong className="text-amber-400">{issue.status}</strong>
        </span>
        <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          Inspect Details &rarr;
        </span>
      </div>
    </div>
  );
};
