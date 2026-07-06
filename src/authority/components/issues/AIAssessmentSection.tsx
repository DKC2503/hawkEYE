import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface AIAssessmentSectionProps {
  issue: AuthorityIssueInspectionItem;
}

export const AIAssessmentSection: React.FC<AIAssessmentSectionProps> = ({ issue }) => {
  const ai = issue.aiAnalysis;
  const confPercent = Math.round(ai.confidence * 100);

  return (
    <div className="space-y-3 p-4 rounded-xl auth-glass-subtle border border-emerald-500/30 bg-emerald-950/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Gemini 2.5 Flash Neural Assessment
        </span>
        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
          {confPercent}% Confidence
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Detected Classification</span>
          <span className="font-bold text-slate-100">{ai.category} ({issue.category.toUpperCase()})</span>
        </div>

        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Neural Summary</span>
          <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-medium">
            {ai.summary}
          </p>
        </div>

        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Inferred Hazard & Safety Risk</span>
          <p className="text-rose-300 leading-relaxed bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 font-medium">
            {ai.visibleRisk}
          </p>
        </div>

        {ai.needsHumanReview && (
          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Flagged for Human Review (Confidence &lt; 90% or boundary case)</span>
          </div>
        )}
      </div>
    </div>
  );
};
