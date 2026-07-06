import React from 'react';
import type { TaskAssignment } from '../../types/authority';

interface AssignmentPreviewProps {
  assignments: TaskAssignment[];
}

export const AssignmentPreview: React.FC<AssignmentPreviewProps> = ({ assignments }) => {
  return (
    <div className="auth-glass-surface rounded-2xl p-6 space-y-4 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100">Shift Task Allocations Preview</h3>
          <p className="text-xs text-slate-400">Active assignments currently dispatched to field crews</p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
          {assignments.length} Active Dispatches
        </span>
      </div>

      <div className="space-y-3">
        {assignments.map((asg) => (
          <div
            key={asg.id}
            className="p-3.5 rounded-xl auth-glass-subtle border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400">{asg.issueTicketId}</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-200">{asg.workerName} ({asg.workerId})</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">{asg.shift}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[11px]">
                {asg.resolutionStage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
