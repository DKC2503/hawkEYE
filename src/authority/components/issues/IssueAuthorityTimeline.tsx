import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface IssueAuthorityTimelineProps {
  issue: AuthorityIssueInspectionItem;
}

export const IssueAuthorityTimeline: React.FC<IssueAuthorityTimelineProps> = ({ issue }) => {
  const events = [
    {
      label: 'Report Submitted by Anonymous Citizen',
      timestamp: issue.reporter.submittedAt,
      active: true,
    },
    {
      label: 'Gemini 2.5 Flash Neural Vision Verification Passed',
      timestamp: issue.reporter.submittedAt,
      active: true,
    },
    {
      label: 'Logged in Cloud Firestore Database',
      timestamp: issue.reporter.submittedAt,
      active: true,
    },
    {
      label: 'Municipal Work Order Dispatch',
      timestamp: issue.assignedWorkerName ? issue.updatedAt : 'Pending Authority Verification',
      active: !!issue.assignedWorkerName,
    },
  ];

  return (
    <div className="space-y-3 p-4 rounded-xl auth-glass-subtle border border-slate-800">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
        Lifecycle Audit Timeline
      </span>

      <div className="relative border-l border-slate-800 ml-2 space-y-4 pl-4 text-xs">
        {events.map((ev, idx) => (
          <div key={idx} className="relative">
            <span
              className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ${
                ev.active ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-slate-700'
              }`}
            />
            <p className={`font-semibold ${ev.active ? 'text-slate-200' : 'text-slate-500'}`}>
              {ev.label}
            </p>
            <span className="text-[10px] font-mono text-slate-400">
              {ev.timestamp.includes('T') ? new Date(ev.timestamp).toLocaleString() : ev.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
