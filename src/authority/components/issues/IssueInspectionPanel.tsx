import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';
import { EvidenceSection } from './EvidenceSection';
import { AIAssessmentSection } from './AIAssessmentSection';
import { AuthorityDecisionSection } from './AuthorityDecisionSection';
import { IssueAuthorityTimeline } from './IssueAuthorityTimeline';

interface IssueInspectionPanelProps {
  issue: AuthorityIssueInspectionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IssueInspectionPanel: React.FC<IssueInspectionPanelProps> = ({
  issue,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop Click Dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Inspection Panel */}
      <div className="w-full max-w-xl bg-[#0d101a] border-l border-slate-800/80 h-full flex flex-col shadow-2xl overflow-hidden animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                {issue.ticketId}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                #{issue.markerNumber} Marker
              </span>
            </div>
            <h3 className="text-base font-bold text-white capitalize">{issue.category} Inspection</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Inspection Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          <EvidenceSection issue={issue} />
          <AIAssessmentSection issue={issue} />
          <AuthorityDecisionSection issue={issue} />
          <IssueAuthorityTimeline issue={issue} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>GVMC Command Hub</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
