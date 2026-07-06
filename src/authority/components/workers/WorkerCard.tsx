import React from 'react';
import type { MunicipalWorker } from '../../types/authority';
import { WorkerCreditDisplay } from './WorkerCreditDisplay';

interface WorkerCardProps {
  worker: MunicipalWorker;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker }) => {
  const getStatusBadge = (status: MunicipalWorker['status']) => {
    const s = String(status);
    if (s === 'Available' || s === 'AVAILABLE') {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (s === 'On Assignment' || s === 'ASSIGNED') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    if (s === 'Off Shift') {
      return 'bg-slate-700/40 text-slate-400 border-slate-700';
    }
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const shiftText = typeof worker.shift === 'object' && worker.shift
    ? `${worker.shift.name} (${worker.shift.startTime} - ${worker.shift.endTime})`
    : String(worker.shift || 'Morning Shift');

  const nameText = worker.fullName || worker.name || 'Municipal Employee';
  const idText = worker.employeeCode || worker.workerId || worker.employeeId || 'EMP-001';

  return (
    <div className="auth-glass-surface rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-amber-500/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100">{nameText}</h4>
            <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {idText}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">{worker.department}</p>
        </div>

        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${getStatusBadge(worker.status)}`}>
          {String(worker.status)}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Current Shift:</span>
          <span className="font-mono text-slate-200">{shiftText}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Active Tasks:</span>
          <span className="font-mono text-slate-200 font-bold">{worker.activeAssignmentsCount || worker.activeAssignmentCount || 0}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Resolved Issues:</span>
          <span className="font-mono text-emerald-400 font-bold">{worker.resolvedCount || 0}</span>
        </div>
      </div>

      <WorkerCreditDisplay credits={worker.credits || 0} />
    </div>
  );
};
