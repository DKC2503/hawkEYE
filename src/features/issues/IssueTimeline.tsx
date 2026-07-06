import React from 'react';
import type { IssueStatus } from '../../types/civic';

interface IssueTimelineProps {
  currentStatus: IssueStatus;
}

export const IssueTimeline: React.FC<IssueTimelineProps> = ({ currentStatus }) => {
  const statuses: IssueStatus[] = ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="py-2 space-y-3">
      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
        Resolution Progress Pipeline
      </div>

      <div className="relative flex items-center justify-between">
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        />

        {/* Step Nodes */}
        {statuses.map((status, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-amber-600 text-white ring-4 ring-amber-400/30 scale-110 shadow-md'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium tracking-tight whitespace-nowrap hidden sm:inline ${
                  isCurrent ? 'text-amber-900 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
